using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
class InstallerSmoke {
 delegate bool EnumCallback(IntPtr window,IntPtr param);
 [DllImport("user32.dll")]static extern bool EnumChildWindows(IntPtr parent,EnumCallback callback,IntPtr param);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern IntPtr SendMessage(IntPtr window,int message,IntPtr size,StringBuilder text);
 [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr window,out Rect rect);
 [StructLayout(LayoutKind.Sequential)]struct Rect{public int Left,Top,Right,Bottom;}
 static int Main(string[] args){
  if(Environment.GetEnvironmentVariable("GITHUB_ACTIONS")!="true")return 2;
  using(var process=Process.Start(new ProcessStartInfo(args[0]){UseShellExecute=true})){
   try{
    IntPtr window=IntPtr.Zero;
    for(int i=0;i<30;i++){Thread.Sleep(300);process.Refresh();window=process.MainWindowHandle;if(window!=IntPtr.Zero)break;}
    if(window==IntPtr.Zero)throw new Exception("Installer first screen was not shown");
    var all=new StringBuilder();EnumChildWindows(window,(child,param)=>{var text=new StringBuilder(4096);SendMessage(child,13,new IntPtr(text.Capacity),text);all.AppendLine(text.ToString());return true;},IntPtr.Zero);
    if(!all.ToString().Contains("Welcome to Typecast Studio"))throw new Exception("English welcome text missing: "+all);
    if(all.ToString().Contains("Select a language"))throw new Exception("Old language dialog is still present");
    Rect rect;if(GetWindowRect(window,out rect))using(var bitmap=new Bitmap(rect.Right-rect.Left,rect.Bottom-rect.Top)){
     using(var g=Graphics.FromImage(bitmap))g.CopyFromScreen(rect.Left,rect.Top,0,0,bitmap.Size);
     bitmap.Save(args[1],System.Drawing.Imaging.ImageFormat.Png);
    }
    Console.WriteLine("PASS: actual installer opens directly to its English welcome screen.");return 0;
   }catch(Exception error){Console.Error.WriteLine(error);return 1;}
   finally{if(!process.HasExited){process.Kill();process.WaitForExit(5000);}}
  }
 }
}
