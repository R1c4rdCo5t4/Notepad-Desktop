const { ipcRenderer } = require("electron")
const path = require('path')

window.addEventListener("DOMContentLoaded", () => {
    const elements = {
        fileName: document.getElementById("fileName"),
        fileTextArea: document.getElementById("fileText")
    }

    const handleFile = (filePath, content="") => {
        document.title = "Notepad+++ - " + filePath 
        elements.fileName.innerHTML = path.parse(filePath).base
        elements.fileTextArea.removeAttribute("disabled")
        elements.fileTextArea.value = content
        elements.fileTextArea.focus()
    }

    ipcRenderer.on("file-created-saved", (_, filePath, content = "") => {
        handleFile(filePath, content)
    })

    ipcRenderer.on("file-saved", () => {
        if (fileName.innerHTML[0] == "*") {
            fileName.innerHTML = fileName.innerHTML.substring(1);
            console.log("!!!!!!")
        }
    })
    
    ipcRenderer.on("file-opened", (_, {filePath,content}) => {
        handleFile(filePath,content)
    })

    elements.fileTextArea.addEventListener("input", (e) => {
        ipcRenderer.send("file-content-updated", e.target.value)
        if (fileName.innerHTML[0] !== "*") {
            fileName.innerHTML = "*" + fileName.innerHTML
        }
    })
})