import { Controller } from "@hotwired/stimulus";
import { DirectUpload } from "@rails/activestorage";

export default class extends Controller {
  //static targets = ["input", "progress"];
  static targets = ["input", "progressContainer", "template", "submit"]; // Renaming target to "progressContainer"

  connect(){
    this.validFiles = []
  }

  uploadFile() {
    const selectedFiles = Array.from(this.inputTarget.files)
    this.maxSizeValue = 200 * 1024 * 1024  // 200 MB in bytes

    if(selectedFiles.length > 5){
      alert(`You can only select ${5} files.`);
      return
    }
    
    this.completedUploads = 0;  // Counter for completed uploads

    let errors = []

    this.validFiles = []

    selectedFiles.forEach((file, index) => {

      // Check the file count
      if (index >= this.limitValue) {
        errors.push(`You can only select ${this.limitValue} files.`);
        return;
      }

      // Accept direct audio uploads and videos that will be processed server-side.
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        errors.push(`File ${file.name} is not an audio or video file.`);
        return;
      }

      // Check the file size
      if (file.size > this.maxSizeValue) {
        errors.push(`File ${file.name} exceeds the size limit of ${this.maxSizeValue / (1024 * 1024)} MB.`);
        return;
      }

      this.validFiles.push({file: file, index: index});
    });

    if(errors.length > 0) {
      alert(JSON.stringify(errors))
    }

    this.totalUploads = this.validFiles.length;

    if (this.totalUploads === 0) {
      return;
    }

    // hide submit button
    this.submitTarget.classList.add("hidden")

    this.validFiles.forEach((validFile) => {
      const {file, index} = validFile
      const identifier = Math.floor(Math.random() * Date.now()).toString(16)
      const progressBar = this.add_template(identifier, file) //this.createProgressBar(identifier);

      const upload = new DirectUpload(
        file,
        this.inputTarget.dataset.directUploadUrl,
        {
          directUploadWillStoreFileWithXHR: (request)=>{
            console.log(progressBar)
            
            request.upload.addEventListener("progress", (event) => {
              this.progressUpdate(event, identifier);
            });
          }
        }
      );

      upload.create((error, blob) => {
        if (error) {
          console.log(error);
        } else {
          this.createHiddenBlobInput(blob);
          // if you're not submitting the form after upload, you need to attach
          // uploaded blob to some model here and skip hidden input.

          this.completedUploads++;
          // Check if all uploads are complete
          this.checkAllUploadsComplete();
        }
      });
    });
  }

  checkAllUploadsComplete() {
    if (this.completedUploads === this.totalUploads) {
      console.log("All uploads are complete!");
      this.submitTarget.classList.remove("hidden")
      // Here you can perform any other actions you want when all files are uploaded
    }
  }

  createProgressBar(index) {
    const progressBar = document.createElement('div');
    progressBar.setAttribute("id", `progress-bar-${index}`);
    progressBar.style.width = "0%";
    progressBar.style.height = "20px";
    progressBar.style.backgroundColor = "green";
    progressBar.style.marginTop = "10px";

    this.progressContainerTarget.appendChild(progressBar); // Append to the container

    return progressBar;
  }

  // add blob id to be submitted with the form
  createHiddenBlobInput(blob) {
    const hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("value", blob.signed_id);
    hiddenField.name = this.inputTarget.name;
    this.element.appendChild(hiddenField);
  }

  add_template(identifier, file) {
    let doc = this.templateTarget
    var content = doc.innerHTML.replace(/NEW_RECORD/g, `progress-bar-${identifier}`);
    content = content.replace(/FILE/g, `${file.name}`);
    this.progressContainerTarget.insertAdjacentHTML('beforebegin', content);
  }

  progressUpdate(event, index) {
    const progress = (event.loaded / event.total) * 100;
    const fileIndex = index

    // updater(ctx, progress, index)

    const progressBar = document.querySelector(`#progress-bar-${fileIndex}`);
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // When a file is dropped onto the designated area
  handleDrop(e) {
    this.preventDefaults(e);
    let files = e.dataTransfer.files;
    this.inputTarget.files = files;
    this.uploadFile();
  }
}
