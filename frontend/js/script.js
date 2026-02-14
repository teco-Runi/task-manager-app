// ================= SIGNUP =================
const signupForm = document.querySelector('.sign-up form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signupForm.username.value.trim();
        const email = signupForm.email.value.trim();
        const password = signupForm.password.value;
        const confirmPassword = signupForm.confirm.value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const res = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Signup failed");
                return;
            }

            alert(data.message);
            signupForm.reset();
            window.location.href = "index.html";

        } catch (err) {
            console.error(err);
            alert("Server error. Try again.");
        }
    });
}

// ================= LOGIN =================
const loginForm = document.querySelector("#loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Login failed");
                return;
            }

            alert(data.message);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "dashboard.html";

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });
}

// ================= DASHBOARD =================
const user = JSON.parse(localStorage.getItem("user"));

if (window.location.pathname.endsWith("dashboard.html")) {
    if (!user) {
        window.location.href = "index.html"; // redirect if not logged in
    } else {
        document.getElementById("welcomeUser").innerText = "Welcome " + user.username + " 🎉";
    }
}

// Elements
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

if (taskForm && taskList) {
    // Load tasks
    async function loadTasks() {
        try {
            const res = await fetch(`/tasks?email=${user.email}`);
            const tasks = await res.json();

            if (!res.ok) {
                alert("Failed to load tasks");
                return;
            }

            taskList.innerHTML = "";
            tasks.forEach(task => addTaskToDOM(task));

        } catch (err) {
            console.error(err);
            alert("Server error while loading tasks");
        }
    }

    loadTasks();

    // Add task
    taskForm.addEventListener("submit", async e => {
        e.preventDefault();
        const taskText = document.getElementById("taskInput").value;
        const status = document.getElementById("status").value;

        try {
            const res = await fetch("/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, taskText, status })
            });

            const task = await res.json();

            if (!res.ok) {
                alert(task.message || "Failed to add task");
                return;
            }

            addTaskToDOM(task);
            taskForm.reset();

        } catch (err) {
            console.error(err);
            alert("Server error while adding task");
        }
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

        // Delete task
        li.querySelector(".delete-btn").addEventListener("click", async () => {
            try {
                const res = await fetch(`/tasks/${task._id}`, { method: "DELETE" });
                if (!res.ok) {
                    alert("Failed to delete task");
                    return;
                }
                li.remove();
            } catch (err) {
                console.error(err);
                alert("Server error while deleting task");
            }
        });

        // Edit task status
        li.querySelector(".edit-btn").addEventListener("click", async () => {
            const newStatus = prompt("Edit Status (Pending / Completed):", task.status);
            if (!newStatus) return;

            try {
                const res = await fetch(`/tasks/${task._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskText: task.taskText, status: newStatus })
                });

                const updatedTask = await res.json();

                if (!res.ok) {
                    alert(updatedTask.message || "Failed to update task");
                    return;
                }

                li.querySelector("span").innerText = `${updatedTask.taskText} - (${updatedTask.status})`;
                task.status = updatedTask.status;

            } catch (err) {
                console.error(err);
                alert("Server error while updating task");
            }
        });

        taskList.appendChild(li);
    }
}

// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}
