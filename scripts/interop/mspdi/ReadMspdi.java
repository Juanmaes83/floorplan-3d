import net.sf.mpxj.*; import net.sf.mpxj.mspdi.MSPDIReader; import java.util.*;
public class ReadMspdi {
  static String q(Object o){ return o==null?"null":"\""+o.toString().replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n")+"\""; }
  public static void main(String[] a) throws Exception {
    ProjectFile p = new MSPDIReader().read(a[0]);
    StringBuilder sb=new StringBuilder("{\"title\":"+q(p.getProjectProperties().getProjectTitle())+",\"calendar\":"+q(p.getDefaultCalendar()==null?null:p.getDefaultCalendar().getName())+",\"tasks\":[");
    boolean first=true;
    for (Task t : p.getTasks()) {
      if (t.getUniqueID()==0) continue;
      if(!first) sb.append(','); first=false;
      sb.append("{\"uid\":"+t.getUniqueID()+",\"name\":"+q(t.getName())+",\"start\":"+q(t.getStart())+",\"finish\":"+q(t.getFinish())+",\"duration\":"+q(t.getDuration())+",\"milestone\":"+t.getMilestone()+",\"wbs\":"+q(t.getWBS())+",\"text1\":"+q(t.getText(1))+",\"text3\":"+q(t.getText(3))+",\"constraint\":"+q(t.getConstraintType())+",\"constraintDate\":"+q(t.getConstraintDate())+",\"percent\":"+q(t.getPercentageComplete())+",\"actualStart\":"+q(t.getActualStart())+",\"preds\":[");
      boolean f2=true;
      for (Relation r : t.getPredecessors()) { if(!f2) sb.append(','); f2=false; sb.append("{\"from\":"+r.getTargetTask().getUniqueID()+",\"to\":"+r.getSourceTask().getUniqueID()+",\"type\":"+q(r.getType())+",\"lag\":"+q(r.getLag())+"}"); }
      sb.append("]}");
    }
    System.out.println(sb.append("]}"));
  }
}
