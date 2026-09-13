const add=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
export function weekStart(date){return add(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));}
export function academicWeeks(date){
 const year=Number(date.slice(0,4))-(date.slice(5,7)<'09'?1:0);
 const weeks=[];
 for(let start=weekStart(`${year}-09-01`);start<`${year+1}-09-01`;start=add(start,7)){
  const thursday=new Date(add(start,3)+'T12:00:00Z');
  const first=new Date(Date.UTC(thursday.getUTCFullYear(),0,1,12));
  const number=Math.ceil(((thursday-first)/864e5+1)/7);
  weeks.push({start,end:add(start,6),number});
 }
 return weeks;
}
