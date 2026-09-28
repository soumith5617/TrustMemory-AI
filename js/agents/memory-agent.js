/* =========================================================================
   MEMORY-AGENT.JS
   Retain / Recall against the simulated Hindsight core (MEM: entityId ->
   {world, experience, opinion, observation}). ensureWorldMemory() lazily
   seeds the World network the first time an entity is viewed.
   ========================================================================= */

function memOf(id){
  if(!MEM[id]) MEM[id] = {world:[], experience:[], opinion:[], observation:[]};
  return MEM[id];
}

/* ---------------------------------------------------------------------
   AGENT ADAPTERS — Hindsight (retain / recall / reflect), LLM classify,
   Voice call. Each has a deterministic fallback and is logged to the
   Agent Activity feed, matching the "demo reliability" requirement.
--------------------------------------------------------------------- */
function retain(entityId, layer, text, meta){
  const m = memOf(entityId);
  m[layer].push({id:uid(), text, meta:meta||{}, t:nowStamp()});
  log('mem','MEMORY AGENT', `Retained ${layer} memory for ${labelFor(entityId)}: "${text}"`);
}
function recall(entityId, note){
  const m = memOf(entityId);
  const count = m.world.length + m.experience.length + m.opinion.length + m.observation.length;
  log('dec','DECISION AGENT', `Recalled ${count} memory entries for ${labelFor(entityId)}${note? ' — '+note:''}.`);
  return m;
}
