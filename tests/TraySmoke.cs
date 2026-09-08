using System;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using System.Drawing;
class TraySmoke {
 [STAThread] static int Main(string[] args) {
  if(Environment.GetEnvironmentVariable("GITHUB_ACTIONS")!="true")return 2;
  Application.EnableVisualStyles();
  var assembly=Assembly.LoadFrom(args[0]);
  var type=assembly.GetType("TypecastStudio.TrayContext",true);
  // The host resolves resources relative to AppDomain.BaseDirectory. This test executable
  // is compiled into the installation directory on the disposable runner.
  var context=(ApplicationContext)Activator.CreateInstance(type,BindingFlags.Instance|BindingFlags.NonPublic,null,new object[]{true},null);
  var tray=(NotifyIcon)type.GetField("Tray",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(context);
  var quit=(ToolStripMenuItem)type.GetField("QuitItem",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(context);
  int result=1,ticks=0;
  var timer=new System.Windows.Forms.Timer{Interval=500};
  timer.Tick+=(s,e)=>{
   try {
    ticks++;
    if(ticks<5)return;
    if(!tray.Visible||tray.Icon==null||tray.ContextMenuStrip.Items.Count!=4)throw new Exception("Tray icon or menu missing");
    if(tray.ContextMenuStrip.Items[0].Text!="Open editor"||quit.Text!="Quit")throw new Exception("Unexpected tray menu");
    if(ticks==5){tray.ContextMenuStrip.Show(new Point(60,60));return;}
    try {
     using(var bitmap=new Bitmap(360,200)) {
      using(var g=Graphics.FromImage(bitmap))g.CopyFromScreen(40,40,0,0,bitmap.Size);
      bitmap.Save(args[1],System.Drawing.Imaging.ImageFormat.Png);
     }
    } catch { /* Some hosted runners have no capturable desktop. */ }
    timer.Stop();quit.PerformClick();result=0;
   } catch(Exception error){Console.Error.WriteLine(error);timer.Stop();quit.PerformClick();}
  };
  timer.Start();Application.Run(context);timer.Dispose();context.Dispose();
  if(result==0)Console.WriteLine("PASS: real Windows NotifyIcon, open/output/quit menu and Quit click shut down the server.");
  return result;
 }
}
