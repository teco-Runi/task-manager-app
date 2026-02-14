// ================= SIGNUP =================
const signupForm = document.querySelector('.sign-up form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signupForm.username.value.trim();
        const email = signupForm.email.value.trim();
        const password = signupForm.password.value;
        const confirmPassword = signupForm.confirm.value;

        if(password !== confirmPassword){
            alert("Passwords do not match!");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            alert(data.message);

            if(res.status === 201){
                signupForm.reset();
                window.location.href = "index.html";
            }

        } catch(err) {
            alert("Server error. Try again.");
            console.error(err);
        }
    });
}


// ================= LOGIN =================

const loginForm = document.querySelector('#loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const res = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            alert(data.message);

            if (res.status === 200) {
                 localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "dashboard.html";
            }

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });
}

// ================= DASHBOARD =================
const user = JSON.parse(localStorage.getItem("user"));
if(!user) window.location.href = "login.html"; // not logged in

document.getElementById("welcomeUser").innerText = "Welcome " + user.username + " 🎉";

// Elements
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

// Load tasks from backend
async function loadTasks() {
    const res = await fetch(`http://localhost:5000/tasks?email=${user.email}`);
    const tasks = await res.json();
    taskList.innerHTML = "";
    tasks.forEach(task => addTaskToDOM(task));
}
loadTasks();

// Add task
taskForm.addEventListener("submit", async e => {
    e.preventDefault();
    const taskText = document.getElementById("taskInput").value;
    const status = document.getElementById("status").value;

    const res = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email: user.email, taskText, status })
    });

    const task = await res.json();
    addTaskToDOM(task);
    taskForm.reset();
});
// Add task to DOM
function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.dataset.id = task._id;
    li.innerHTML = `
        <span>${task.taskText} - (${task.status})</span>
        <div>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    li.querySelector(".delete-btn").addEventListener("click", async ()=>{
        await fetch(`http://localhost:5000/tasks/${task._id}`, { method:"DELETE" });
        li.remove();
    });
    li.querySelector(".edit-btn").addEventListener("click", async () => {

    const newStatus = prompt("Edit Status (Pending / Completed):", task.status);
    if (!newStatus) return;

    const res = await fetch(`http://localhost:5000/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            taskText: task.taskText,  // keep existing text
            status: newStatus         // change only status
        })
    });

    if (res.ok) {
        const updatedTask = await res.json();

        li.querySelector("span").innerText =
            `${updatedTask.taskText} - (${updatedTask.status})`;

        task.status = updatedTask.status; // update local object
    }
});

    taskList.appendChild(li);
}
// Logout
function logout(){
    localStorage.removeItem("user");
    window.location.href = "index.html";
}
