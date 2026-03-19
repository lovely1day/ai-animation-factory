async function run(){
  try{
    const res = await fetch("http://localhost:11434/api/generate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"mistral",
        prompt:"Write 3 short animated scenes about a squirrel time traveler.",
        stream:false
      })
    });
    const data = await res.json();
    console.log("=== RESPONSE ===");
    console.log(data.response);
  }catch(err){
    console.error("ERROR:",err);
  }
}
run();
