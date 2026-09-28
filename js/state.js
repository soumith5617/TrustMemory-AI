/* =========================================================================
   STATE.JS — global app state, seed data, nav config
   Shared by every module below (loaded first, plain global scope — no
   bundler / ES modules, so this works straight off the filesystem).
   ========================================================================= */

const NAV = [
  {id:'dashboard', label:'Coordinator Dashboard'},
  {id:'helpers', label:'Helpers'},
  {id:'households', label:'Households'},
  {id:'placements', label:'Placements'},
  {id:'memory', label:'Hindsight Core'},
  {id:'matching', label:'Matching'},
  {id:'insights', label:'Insights'},
  {id:'voice', label:'Voice Agent'},
  {id:'activity', label:'Agent Activity'},
  {id:'demo', label:'Demo Mode'},
  {id:'architecture', label:'Architecture'},
  {id:'settings', label:'Settings'},
];

/* ---------------------------------------------------------------------
   SEED DATA
--------------------------------------------------------------------- */
function seed(){
  const helpers = [
    {id:'anita', name:'Anita Verma', location:'Hyderabad', exp:6,
      skills:['elder_care','cleaning'], availability:'Full-time',
      roleScores:{elder_care:88, child_care:60, cleaning:70, cooking:55},
      color:'#8F6A2E'},
    {id:'priya', name:'Priya Nair', location:'Hyderabad', exp:4,
      skills:['elder_care','child_care','cleaning'], availability:'Full-time',
      roleScores:{elder_care:93, child_care:38, cleaning:74, cooking:50},
      color:'#3F6659'},
    {id:'radha', name:'Radha Kumari', location:'Secunderabad', exp:7,
      skills:['child_care','cooking'], availability:'Full-time',
      roleScores:{elder_care:45, child_care:90, cleaning:55, cooking:80},
      color:'#5B4A8F'},
    {id:'sunita', name:'Sunita Devi', location:'Hyderabad', exp:3,
      skills:['cleaning','cooking'], availability:'Part-time',
      roleScores:{elder_care:50, child_care:48, cleaning:78, cooking:65},
      color:'#A6453A'},
    {id:'meena', name:'Meena Joshi', location:'Gachibowli', exp:9,
      skills:['elder_care','cooking'], availability:'Full-time',
      roleScores:{elder_care:81, child_care:52, cleaning:60, cooking:85},
      color:'#31507A'},
    {id:'kavita', name:'Kavita Reddy', location:'Kukatpally', exp:5,
      skills:['child_care'], availability:'Full-time',
      roleScores:{elder_care:40, child_care:76, cleaning:58, cooking:52},
      color:'#8F6A2E'},
    {id:'lakshmi', name:'Lakshmi Rao', location:'Hyderabad', exp:10,
      skills:['cleaning'], availability:'Full-time',
      roleScores:{elder_care:55, child_care:40, cleaning:92, cooking:48},
      color:'#3F6659'},
    {id:'fatima', name:'Fatima Sheikh', location:'Begumpet', exp:2,
      skills:['elder_care','child_care'], availability:'Full-time',
      roleScores:{elder_care:70, child_care:65, cleaning:50, cooking:45},
      color:'#5B4A8F'},
  ];

  const households = [
    {id:'h101', name:'Sharma Residence', location:'Jubilee Hills', requirement:'cleaning', schedule:'Weekday mornings'},
    {id:'h102', name:'Reddy Residence', location:'Banjara Hills', requirement:'elder_care', schedule:'Live-in'},
    {id:'h104', name:'Iyer Residence', location:'Madhapur', requirement:'child_care', schedule:'Weekday, 9am–6pm'},
    {id:'h105', name:'Gupta Residence', location:'Kondapur', requirement:'child_care', schedule:'Weekday, 8am–5pm'},
    {id:'h106', name:'Nair Residence', location:'Gachibowli', requirement:'elder_care', schedule:'Live-in, new requirement'},
    {id:'h107', name:'Verma Residence', location:'Himayatnagar', requirement:'elder_care', schedule:'Full-time'},
  ];

  const placements = [
    {id:'p1', helperId:'anita', householdId:'h107', role:'elder_care', start:'2026-01-05', end:null, status:'active'},
    {id:'p2', helperId:'priya', householdId:'h102', role:'elder_care', start:'2025-11-10', end:null, status:'active'},
    {id:'p3', helperId:'priya', householdId:'h105', role:'child_care', start:'2025-08-01', end:'2025-09-14', status:'ended_poor_fit'},
    {id:'p4', helperId:'sunita', householdId:'h104', role:'child_care', start:'2025-09-01', end:'2025-10-20', status:'failed'},
    {id:'p5', helperId:'kavita', householdId:'h104', role:'child_care', start:'2025-11-01', end:'2025-12-15', status:'failed'},
    {id:'p6', helperId:'fatima', householdId:'h104', role:'child_care', start:'2026-01-10', end:'2026-02-18', status:'failed'},
    {id:'p7', helperId:'lakshmi', householdId:'h101', role:'cleaning', start:'2025-06-01', end:null, status:'active'},
    {id:'p8', helperId:'meena', householdId:'h106', role:'cooking', start:'2025-05-01', end:null, status:'active'},
  ];

  // seed events — the underlying "experience" record for each helper/household,
  // deliberately authored (not random) to tell a believable story.
  const events = [
    // Anita — reliable history, ends just before the demo scenario begins
    ev('anita','h107','p1','placement_start','Placement started at Verma Residence.','info','2026-01-05'),
    ev('anita','h107','p1','positive_feedback','Household reported excellent care and punctuality.','info','2026-01-17'),
    ev('anita','h107','p1','positive_feedback','Household praised communication and reliability.','info','2026-02-18'),

    // Priya — strong elder care, weak childcare (role-fit story)
    ev('priya','h102','p2','placement_start','Placement started at Reddy Residence (elder care).','info','2025-11-10'),
    ev('priya','h102','p2','positive_feedback','Household highly satisfied with elder-care routine.','info','2025-12-02'),
    ev('priya','h102','p2','positive_feedback','Consistent, attentive care reported again.','info','2026-01-20'),
    ev('priya','h105','p3','complaint','Household reported difficulty managing two young children.','medium','2025-08-28'),
    ev('priya','h105','p3','negative_feedback','Household felt childcare routine was not a good fit.','medium','2025-09-10'),
    ev('priya','h105','p3','placement_end','Placement ended — role mismatch (child care).','info','2025-09-14'),

    // Household H104 — three different helpers, three failures (fair-blame story)
    ev('sunita','h104','p4','placement_start','Placement started at Iyer Residence (child care).','info','2025-09-01'),
    ev('sunita','h104','p4','complaint','Household reported schedule expectations were not being met.','medium','2025-09-25'),
    ev('sunita','h104','p4','placement_end','Placement ended — household requested replacement.','info','2025-10-20'),
    ev('kavita','h104','p5','placement_start','Placement started at Iyer Residence (child care).','info','2025-11-01'),
    ev('kavita','h104','p5','complaint','Household reported dissatisfaction with schedule adherence.','medium','2025-11-30'),
    ev('kavita','h104','p5','placement_end','Placement ended — household requested replacement.','info','2025-12-15'),
    ev('fatima','h104','p6','placement_start','Placement started at Iyer Residence (child care).','info','2026-01-10'),
    ev('fatima','h104','p6','complaint','Household reported schedule expectations were not met again.','medium','2026-02-05'),
    ev('fatima','h104','p6','placement_end','Placement ended — household requested replacement.','info','2026-02-18'),

    // Lakshmi — steady cleaning specialist
    ev('lakshmi','h101','p7','placement_start','Placement started at Sharma Residence.','info','2025-06-01'),
    ev('lakshmi','h101','p7','positive_feedback','Consistently thorough, on-time service.','info','2025-09-12'),
    ev('lakshmi','h101','p7','positive_feedback','Household renewed engagement, cited reliability.','info','2026-01-15'),

    // Meena — strong general history
    ev('meena','h106','p8','placement_start','Placement started at Nair Residence (cooking).','info','2025-05-01'),
    ev('meena','h106','p8','positive_feedback','Household satisfied with meal planning and hygiene.','info','2025-08-20'),

    // Radha — strong childcare track record (context helper)
    ev('radha', null, null, 'positive_feedback','Previous household praised patience with toddlers.','info','2025-10-05'),
    ev('radha', null, null, 'placement_end','Prior placement completed successfully, contract concluded.','info','2025-12-01'),
  ];

  return {helpers, households, placements, events, calls:[], reflections:[], recommendations:[], activity:[], stagedBackups:[]};

  function ev(helperId, householdId, placementId, type, description, severity, date){
    return {id:uid(), helperId, householdId, placementId, type, description, severity, date, source:'seed'};
  }
}

function uid(){return Math.random().toString(36).slice(2,9);}


/* ---------------------------------------------------------------------
   STATE
--------------------------------------------------------------------- */
let INITIAL = seed();
let S = clone(INITIAL);
let MEM = {}; // entityId -> {world:[], experience:[], opinion:[], observation:[]}
let SCORES = {}; // entityId -> {trust, churn, difficulty}
let route = {page:'dashboard', param:null};
let clockBase = new Date('2026-03-08T09:00:00');
let clockTick = 0;


function clone(o){return JSON.parse(JSON.stringify(o));}
function nowStamp(){
  clockTick += 1;
  const d = new Date(clockBase.getTime() + clockTick*37000);
  return d.toTimeString().slice(0,8);
}

