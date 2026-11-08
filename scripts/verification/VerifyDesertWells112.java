import java.io.File;
import java.nio.file.*;
// Standalone block-level check against the official, unmodified 1.12.2 server
// jar (SHA-1 886945bfb2b978778c3a0288fd7fab09d315b25f). Class and method
// names below are Mojang's obfuscated runtime API names for that exact jar.
// No network listener is started. Always run from a disposable scratch folder.
// Block IDs: 8 water, 24 sandstone, 44 stone slab (the well's roof slabs).
// WorldServer performs normal chunk generation and feature population.
public class VerifyDesertWells112 {
 static pl playerList; static int checks;
 static void block(oo w,int x,int y,int z,int expected) {
  int actual=aow.a(w.o(new et(x,y,z)).u());checks++;
  if(actual!=expected)throw new AssertionError(x+","+y+","+z+": expected "+expected+", got "+actual);
 }
 public static void main(String[] args) throws Exception {
  ni.c();ry fix=rz.a();nz server=new nz(new File("."),fix,null,null,null,null){public int aE(){return 10;}public boolean j(){return true;}public pl am(){return playerList;}};
  playerList=new pl(server){};server.a(playerList);
  amx settings=new amx(873956122367342323L,ams.b,true,false,amz.b);
  String worldName="wells-fresh-"+System.currentTimeMillis();
  oo world=new oo(server,new bey(new File("."),worldName,true,fix),new bfd(settings,worldName),0,new rl());world.b();server.d=new oo[]{world};
  for(int cx=1;cx<=8;cx++)for(int cz=513;cz<=523;cz++)world.a(cx,cz);
  int[][] points={{66,65,8322},{77,62,8270},{67,62,8268}};
  String json="{\"seed\":\"873956122367342323\",\"edition\":\"java\",\"version\":\"1.12.2\",\"serverSha1\":\"886945bfb2b978778c3a0288fd7fab09d315b25f\",\"worldType\":\"default\",\"structures\":true,\"wells\":[";
  for(int n=0;n<points.length;n++) {
   int x=points[n][0],y=points[n][1],z=points[n][2];
   for(int dx=-2;dx<=2;dx++)for(int dz=-2;dz<=2;dz++)block(world,x+dx,y-1,z+dz,24);
   for(int dx=-2;dx<=2;dx++)for(int dz=-2;dz<=2;dz++)block(world,x+dx,y,z+dz,(dx==0&&Math.abs(dz)<=1||dz==0&&Math.abs(dx)<=1)?8:24);
   for(int dx=-1;dx<=1;dx+=2)for(int dz=-1;dz<=1;dz+=2)for(int dy=1;dy<=3;dy++)block(world,x+dx,y+dy,z+dz,24);
   for(int dx=-1;dx<=1;dx++)for(int dz=-1;dz<=1;dz++)block(world,x+dx,y+4,z+dz,dx==0&&dz==0?24:44);
   System.out.println("CONFIRMED well "+x+","+y+","+z);
   if(n>0)json+=",";json+="{\"x\":"+x+",\"y\":"+y+",\"z\":"+z+",\"blockChecks\":71}";
  }
  json+="],\"totalBlockChecks\":"+checks+",\"result\":\"confirmed\"}";
  Files.write(Paths.get("well-verification.json"),json.getBytes("UTF-8"));
  world.a(true,null);System.out.println("CONFIRMED "+checks+" block checks in "+worldName);System.exit(0);
 }
}
