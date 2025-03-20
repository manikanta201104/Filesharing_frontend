const dropZone = document.querySelector(".drop-zone");
const fileInput = document.querySelector("#fileInput");
const browseBtn = document.querySelector("#browseBtn");

const bgProgress = document.querySelector(".bg-progress");
const progressPercent = document.querySelector("#progressPercent");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const status = document.querySelector(".status");

const sharingContainer = document.querySelector(".sharing-container");
const copyURLBtn = document.querySelector("#copyURLBtn");
const fileURL = document.querySelector("#fileURL");
const emailForm = document.querySelector("#emailForm");

const toast = document.querySelector(".toast");

const baseURL = "https://filesharing-backend-6uqo.onrender.com";
const uploadURL = `${baseURL}/api/files`;
const emailURL = `${baseURL}/api/files/send`;

const maxAllowedSize = 100 * 1024 * 1024; //100mb

browseBtn.addEventListener("click", () => {
  fileInput.click();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length === 1) {
    if (files[0].size < maxAllowedSize) {
      fileInput.files = files;
      uploadFile();
    } else {
      showToast("Max file size is 100MB");
    }
  } else if (files.length > 1) {
    showToast("You can't upload multiple files");
  }
  dropZone.classList.remove("dragged");
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragged");
});

dropZone.addEventListener("dragleave", (e) => {
  dropZone.classList.remove("dragged");
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0].size > maxAllowedSize) {
    showToast("Max file size is 100MB");
    fileInput.value = "";
    return;
  }
  uploadFile();
});

copyURLBtn.addEventListener("click", () => {
  fileURL.select();
  navigator.clipboard.writeText(fileURL.value);
  showToast("Copied to clipboard");
});

fileURL.addEventListener("click", () => {
  fileURL.select();
});

const uploadFile = async () => {
  try {
    const files = fileInput.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("myfile", files[0]);

    progressContainer.style.display = "block";
    status.innerText = "Uploading...";

    const response = await fetch(uploadURL, {
      method: "POST",
      body: formData,
      // Add headers if your backend requires specific ones
      // headers: {
      //   "Accept": "application/json"
      // }
    });

    // Simulate progress (since we can't get real progress with fetch easily)
    let percent = 0;
    const progressInterval = setInterval(() => {
      if (percent < 90) {
        percent += 10;
        progressPercent.innerText = percent;
        const scaleX = `scaleX(${percent / 100})`;
        bgProgress.style.transform = scaleX;
        progressBar.style.transform = scaleX;
      }
    }, 200);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    clearInterval(progressInterval);
    
    // Complete the progress bar
    progressPercent.innerText = 100;
    bgProgress.style.transform = "scaleX(1)";
    progressBar.style.transform = "scaleX(1)";

    onFileUploadSuccess(data);
  } catch (error) {
    showToast(`Error in upload: ${error.message}`);
    fileInput.value = "";
    progressContainer.style.display = "none";
  }
};

const onFileUploadSuccess = (data) => {
  fileInput.value = "";
  status.innerText = "Uploaded";
  
  emailForm[2].removeAttribute("disabled");
  emailForm[2].innerText = "Send";
  progressContainer.style.display = "none";

  sharingContainer.style.display = "block";
  fileURL.value = data.file; // Adjust this based on your backend response structure
};

emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  emailForm[2].setAttribute("disabled", "true");
  emailForm[2].innerText = "Sending";

  const url = fileURL.value;
  const formData = {
    uuid: url.split("/").pop(),
    emailTo: emailForm.elements["to-email"].value,
    emailFrom: emailForm.elements["from-email"].value,
  };

  try {
    const response = await fetch(emailURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (data.success) {
      showToast("Email Sent");
      sharingContainer.style.display = "none";
    } else {
      throw new Error(data.error || "Failed to send email");
    }
  } catch (error) {
    showToast(`Error sending email: ${error.message}`);
    emailForm[2].removeAttribute("disabled");
    emailForm[2].innerText = "Send";
  }
});

let toastTimer;
const showToast = (msg) => {
  clearTimeout(toastTimer);
  toast.innerText = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
};