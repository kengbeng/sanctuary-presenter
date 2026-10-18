from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
# Manual transport-fault fixture. Never deploy this server or its injected page.
ROOT=Path(__file__).resolve().parents[1] / 'dist'
SCRIPT=r'''<script>
if(location.hash.startsWith('#/output')){
 const original=BroadcastChannel.prototype.postMessage; let held=[],seq=0,hold=true;
 const log=[]; const panel=document.createElement('aside');
 const send=(ch,m)=>original.call(ch,{...m,seq:++seq});
 BroadcastChannel.prototype.postMessage=function(m){
  if(m&&m.v===1){
   if(hold&&m.type==='OUTPUT_STATUS'&&m.rendered&&!m.blank){held.push([this,{...m}]); log.push('Held rendered frame '+m.frameId); render(); return;}
   if(m.type==='SET_BLANK'||(m.type==='OUTPUT_STATUS'&&m.blank))log.push('Black status sent');
   send(this,m); render(); return;
  }return original.call(this,m);
 };
 function render(){if(panel.isConnected)panel.querySelector('output').textContent='Held confirmations: '+held.length+' · '+log.slice(-1).join('');}
 window.addEventListener('DOMContentLoaded',()=>{
  panel.style='position:fixed;top:10px;left:10px;z-index:99999;background:#fff;color:#000;padding:12px;font:16px sans-serif;border:3px solid orange';
  panel.innerHTML='<strong>LOCAL MANUAL FAULT CHECK — no production change</strong><br><output></output><br><button>Release late confirmation</button> <button>Hide fault controls</button>';
  const bs=panel.querySelectorAll('button');bs[0].onclick=()=>{hold=false;for(const [ch,m]of held)send(ch,m);log.push('Released '+held.length+' old rendered confirmations using fresh sequence numbers');held=[];render();};bs[1].onclick=()=>panel.remove();document.body.append(panel);render();
 });
}
</script>'''
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  p=self.path.split('?',1)[0]
  base='/sanctuary-presenter/'
  if not p.startswith(base):self.send_error(404);return
  rel=p[len(base):] or 'index.html'
  path=(ROOT/rel).resolve()
  if not path.is_relative_to(ROOT) or not path.is_file():self.send_error(404);return
  data=path.read_bytes()
  if rel=='index.html':data=data.replace(b'<head>',b'<head>'+SCRIPT.encode())
  self.send_response(200);self.send_header('Content-Type',self.guess_type(str(path)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
ThreadingHTTPServer(('127.0.0.1',4180),Handler).serve_forever()
