using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Security.Principal;
using System.Threading;
using System.Windows.Forms;

namespace TypecastStudio {
    internal static class Program {
        internal static readonly string Root = AppDomain.CurrentDomain.BaseDirectory;
        internal static readonly string Identity = WindowsIdentity.GetCurrent().User.Value;
        internal static readonly string StopName = @"Local\TypecastStudio.Stop." + Identity;
        internal static Process StartNode(string script) {
            return Process.Start(new ProcessStartInfo(Path.Combine(Root, @"runtime\node.exe"), "\"" + Path.Combine(Root, script) + "\" --no-open") {
                UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = Root
            });
        }
        internal static void OpenEditor() {
            Process.Start(new ProcessStartInfo("http://localhost:4318") { UseShellExecute = true });
        }
        [STAThread]
        private static void Main(string[] args) {
            Application.EnableVisualStyles();
            bool background = Array.IndexOf(args, "--background") >= 0;
            if (Array.IndexOf(args, "--stop") >= 0) {
                try { using (var signal = EventWaitHandle.OpenExisting(StopName)) signal.Set(); }
                catch (WaitHandleCannotBeOpenedException) { try { using (var p = StartNode("control.mjs")) p.WaitForExit(4000); } catch {} }
                return;
            }
            bool first;
            using (var mutex = new Mutex(true, @"Local\TypecastStudio.Host." + Identity, out first)) {
                if (!first) { if (!background) try { OpenEditor(); } catch {} return; }
                try { using (var context = new TrayContext(background)) Application.Run(context); }
                catch (Exception error) {
                    var data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Typecast Studio");
                    Directory.CreateDirectory(data); File.WriteAllText(Path.Combine(data, "startup-error.log"), error.ToString());
                    if (!background) MessageBox.Show("Typecast Studio could not start. Please restart the app.\n\n" + error.Message, "Typecast Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                finally { mutex.ReleaseMutex(); }
            }
        }
    }

    internal sealed class TrayContext : ApplicationContext {
        // These fields are inspected by the Windows-only tray integration test.
        internal readonly NotifyIcon Tray;
        internal readonly ToolStripMenuItem QuitItem;
        private readonly Control dispatcher = new Control();
        private readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        private readonly EventWaitHandle stopSignal;
        private readonly RegisteredWaitHandle stopWait;
        private readonly Process server;
        private readonly Icon icon;
        private bool stopping, ready, disposed;
        private int attempts;
        private readonly bool openOnReady;
        internal TrayContext(bool background) {
            openOnReady = !background;
            var handle = dispatcher.Handle;
            stopSignal = new EventWaitHandle(false, EventResetMode.AutoReset, Program.StopName);
            var menu = new ContextMenuStrip();
            var editorItem = new ToolStripMenuItem("Open editor", null, (s,e) => OpenEditor());
            var outputItem = new ToolStripMenuItem("Open output window", null, (s,e) => OpenOutput());
            QuitItem = new ToolStripMenuItem("Quit", null, (s,e) => Stop());
            menu.Items.Add(editorItem); menu.Items.Add(outputItem); menu.Items.Add(new ToolStripSeparator()); menu.Items.Add(QuitItem);
            icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application;
            Tray = new NotifyIcon { Text = "Typecast Studio", Icon = icon, ContextMenuStrip = menu, Visible = true };
            Tray.DoubleClick += (s,e) => OpenEditor();
            stopWait = ThreadPool.RegisterWaitForSingleObject(stopSignal, (s,timeout) => {
                try { dispatcher.BeginInvoke((Action)(() => QuitItem.PerformClick())); } catch (InvalidOperationException) {}
            }, null, Timeout.Infinite, false);
            server = Program.StartNode("server.mjs");
            timer.Interval = 500;
            timer.Tick += (s,e) => Tick();
            timer.Start();
        }
        private static string Request(string path, string body) {
            var request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:4318" + path);
            request.Proxy = null; request.Timeout = 1200; request.ReadWriteTimeout = 1200;
            if (body != null) {
                request.Method = "POST"; request.ContentType = "application/json";
                var bytes = System.Text.Encoding.UTF8.GetBytes(body);request.ContentLength = bytes.Length;
                using (var stream = request.GetRequestStream()) stream.Write(bytes, 0, bytes.Length);
            }
            using (var response = request.GetResponse()) using (var reader = new StreamReader(response.GetResponseStream())) return reader.ReadToEnd();
        }
        private void Tick() {
            if (stopping) return;
            if (ready && server.HasExited) { Stop(); return; }
            if (ready) return;
            attempts++;
            try {
                if (Request("/api/health", null).Contains("\"app\":\"typecast-studio\"")) {
                    ready = true;
                    if (openOnReady) OpenEditor();
                    return;
                }
            } catch {}
            if (attempts >= 20 || server.HasExited) {
                Tray.ShowBalloonTip(5000, "Typecast Studio", "Could not start. Check port 4318 or restart the app.", ToolTipIcon.Error);
                Stop();
            }
        }
        private void OpenEditor() {
            try { Program.OpenEditor(); } catch { Tray.ShowBalloonTip(3000, "Typecast Studio", "Open http://localhost:4318 in your browser.", ToolTipIcon.Info); }
        }
        private void OpenOutput() {
            try { Request("/api/capture-window", "{}"); }
            catch { Tray.ShowBalloonTip(4000, "Typecast Studio", "Open the editor to create an output window.", ToolTipIcon.Info); }
        }
        private void Stop() {
            if (stopping) return;
            stopping = true;timer.Stop();
            try { Request("/api/shutdown", "{}"); } catch {}
            try { if (!server.WaitForExit(3000)) server.Kill(); } catch (InvalidOperationException) {}
            ExitThread();
        }
        protected override void Dispose(bool disposing) {
            if (disposing && !disposed) {
                disposed = true;
                timer.Dispose();stopWait.Unregister(null);stopSignal.Dispose();
                Tray.Visible = false;Tray.ContextMenuStrip.Dispose();Tray.Dispose();icon.Dispose();dispatcher.Dispose();server.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
