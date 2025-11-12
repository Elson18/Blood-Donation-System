const donorForm = document.getElementById("donor-form");
const feedback = document.querySelector("[data-feedback]");

// 👇 Change this to your deployed backend API URL
const API_BASE_URL = "https://lifepulse-api.onrender.com"; // e.g., Render backend URL

donorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback.textContent = "Submitting...";

  const formData = Object.fromEntries(new FormData(donorForm));

  try {
    const response = await fetch(`${API_BASE_URL}/api/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!response.ok) {
      feedback.textContent = "❌ " + (result.message || "Submission failed.");
      feedback.style.color = "red";
      return;
    }

    feedback.textContent = "✅ Donor registered successfully!";
    feedback.style.color = "green";
    donorForm.reset();
  } catch (error) {
    console.error("Error:", error);
    feedback.textContent = "❌ Could not reach the server.";
    feedback.style.color = "red";
  }
});
