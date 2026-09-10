const API_BASE_URL="http://localhost:8080";

document.querySelectorAll(".password-toggle").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const input=document.getElementById(btn.dataset.target);
    input.type=input.type==="password"?"text":"password";
    btn.textContent=input.type==="password"?"Show":"Hide";
  });
});

const signupForm=document.getElementById("signupForm");
if(signupForm){
 signupForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const name=document.getElementById("signupName").value.trim();
  const email=document.getElementById("signupEmail").value.trim();
  const password=document.getElementById("signupPassword").value;
  const confirm=document.getElementById("signupConfirm").value;
  if(password!==confirm){alert("Passwords do not match.");return;}
  try{
   const res=await fetch(`${API_BASE_URL}/api/users`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password})});
   if(!res.ok) throw new Error(`Registration failed: ${res.status}`);
   alert("Account created successfully!");
   location.href="login.html";
  }catch(err){console.error(err);alert("Could not create account. Make sure the Spring Boot server is running.");}
 });
}

const loginForm=document.getElementById("loginForm");
if(loginForm) loginForm.addEventListener("submit",e=>{
 e.preventDefault();
 alert("Login page is ready. We will connect it to the Spring Boot login endpoint next.");
});

const logout=document.getElementById("logoutBtn");
if(logout) logout.addEventListener("click",()=>location.href="login.html");
