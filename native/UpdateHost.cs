using System;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;

internal static class UpdateHost {
 private static void Log(Exception error) { try { File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"update-error.log"),error.ToString()); } catch {} }
 [STAThread] private static int Main(string[] args) {
  if(args.Length!=3)return 2;
  try {
   var installer=Path.GetFullPath(args[0]);var root=Path.GetFullPath(args[1]);
   if(!File.Exists(Path.Combine(root,"TypecastStudio.exe"))||!Path.GetFileName(installer).StartsWith("Typecast-Studio-Setup-"))throw new Exception("Invalid update paths.");
   // Keep the verified file locked against replacement until elevation completes.
   using(var file=new FileStream(installer,FileMode.Open,FileAccess.Read,FileShare.Read)) {
    using(var sha=SHA256.Create()) {
     var digest=BitConverter.ToString(sha.ComputeHash(file)).Replace("-","").ToLowerInvariant();
     if(digest!=args[2])throw new Exception("Update checksum mismatch.");
    }
    using(var process=Process.Start(new ProcessStartInfo(installer,"/S /UPDATE /D="+root){UseShellExecute=true,Verb="runas"})) {
     process.WaitForExit();if(process.ExitCode!=0)throw new Exception("Installer returned "+process.ExitCode);
    }
   }
   Thread.Sleep(1200);
   Process.Start(new ProcessStartInfo(Path.Combine(root,"TypecastStudio.exe"),"--background"){UseShellExecute=true});
   return 0;
  } catch(System.ComponentModel.Win32Exception error) {
   if(error.NativeErrorCode==1223)return 3;
   Log(error);MessageBox.Show("Update could not start. Please try again.\n\n"+error.Message,"Typecast Studio",MessageBoxButtons.OK,MessageBoxIcon.Error);return 1;
  } catch(Exception error) {
   Log(error);MessageBox.Show("Update failed. Your saved text is unchanged.\n\n"+error.Message,"Typecast Studio",MessageBoxButtons.OK,MessageBoxIcon.Error);return 1;
  }
 }
}
