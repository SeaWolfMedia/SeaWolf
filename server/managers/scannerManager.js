class ScannerManager extends EventEmitter {
    constructor(){
        super();
        this.scanner = require("@util/scanner.js"); // Option to change scanner later if wanted
        this.scanner.on(scannerEvent, (event) =>{

        });
    }
    on(scannerEvent){
        switch(scannerEvent){
            case "file-create":
                this.emit("file-create");
                break;
            default:
                break;
        }
    }
}