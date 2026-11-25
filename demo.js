export function demo() {
  return {version:1,title:'Community garden pitch',description:'Propose a small community garden. Explain the need, support your choices with evidence, and present a realistic plan.',criteria:[
    {id:'reasoning',name:'Evidence & reasoning',detail:'Use relevant evidence to explain how the garden meets a community need.',weight:40},
    {id:'planning',name:'Practical planning',detail:'Describe achievable steps, resources, and a way to measure success.',weight:35},
    {id:'communication',name:'Clear communication',detail:'Organize the pitch so another person can understand and act on the proposal.',weight:25}
  ],sample:{label:'Practice pitch A (synthetic)',scores:{reasoning:2,planning:1,communication:3},feedback:{reasoning:'The proposal connects food access to the garden location. Add a source for the estimated demand.',planning:'The planting steps are clear. The resource list still needs quantities and ownership.',communication:'The introduction, plan, and closing request are easy to follow.'},nextStep:'Add a short resource table with quantities, responsible people, and a timeline.'}};
}
