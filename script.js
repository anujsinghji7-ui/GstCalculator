const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const proceedBtn = document.getElementById("proceedBtn");
const uploadNotification = document.getElementById("uploadNotification");

function isSupportedFile(file) {
    const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    return allowedTypes.includes(file.type) ||
        /\.(csv|xls|xlsx)$/i.test(file.name);
}

function showUploadNotification(message) {
    uploadNotification.textContent = message;
    uploadNotification.hidden = false;

    clearTimeout(showUploadNotification.timeoutId);
    showUploadNotification.timeoutId = setTimeout(() => {
        uploadNotification.hidden = true;
        uploadNotification.textContent = "";
    }, 3000);
}

function attachFile(files) {
    if (!files || !files.length) return;

    const file = files[0];

    if (!isSupportedFile(file)) {
        uploadNotification.hidden = true;
        uploadNotification.textContent = "";
        alert("Please select a CSV, XLS, or XLSX file.");
        return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    showUploadNotification("File uploaded successfully!");
}

function processFile() {
    const homeState = document.getElementById("homeState").value.trim().toLowerCase();
    const gstRate = parseFloat(document.getElementById("gstRate").value);

    if (!fileInput.files.length) {
        alert("Please select a file.");
        return;
    }

    if (!homeState) {
        alert("Please enter Home State.");
        return;
    }

    if (Number.isNaN(gstRate)) {
        alert("Please enter a valid GST rate.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            processGST(jsonData, homeState, gstRate);
        } catch (error) {
            console.error(error);
            alert("Unable to read the selected file. Please make sure it is a valid spreadsheet.");
        }
    };

    reader.readAsArrayBuffer(file);
}

function processGST(data, homeState, gstRate) {
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";

    let totalTaxable = 0;
    let totalGST = 0;
    let processedCount = 0;

    data.forEach(row => {
        const state = row.State || row.STATE || row.state || "";
        const taxable = parseFloat(
            row["Taxable Value"] ||
            row["Taxable value"] ||
            row["taxable value"] ||
            row["Taxable"] ||
            0
        );

        if (Number.isNaN(taxable) || taxable <= 0) return;

        processedCount += 1;

        const gstType = state.toLowerCase() === homeState ? "CGST + SGST" : "IGST";
        const gstAmount = taxable * (gstRate / 100);
        const totalAmount = taxable + gstAmount;

        totalTaxable += taxable;
        totalGST += gstAmount;

        tbody.innerHTML += `
            <tr>
                <td>${state}</td>
                <td>₹${taxable.toFixed(2)}</td>
                <td>${gstType}</td>
                <td>₹${gstAmount.toFixed(2)}</td>
                <td>₹${totalAmount.toFixed(2)}</td>
            </tr>
        `;
    });

    document.getElementById("recordCount").textContent = processedCount;
    document.getElementById("taxableTotal").textContent = totalTaxable.toFixed(2);
    document.getElementById("gstTotal").textContent = totalGST.toFixed(2);
}

fileInput.addEventListener("change", (event) => {
    attachFile(event.target.files);
});

proceedBtn.addEventListener("click", processFile);

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    if (!dropZone.contains(event.relatedTarget)) {
        dropZone.classList.remove("dragover");
    }
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    attachFile(event.dataTransfer.files);
});