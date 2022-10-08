   /*
    *       CODE IT'S A BIT MESSY AND/OR REPETITIVE
    *       I'M SORRY,
    */
   // @ts-nocheck
   const fetch = require('node-fetch');
   var FormData = require('form-data');
   /**
    * @constant {string}
    * @default  
    */
   const baseUri = "https://apiv2.gofile.io/"
   /**
    *  @classdesc api wrapper class for Gofile rest api
    */
   class apiGofile {
       /** 
        * @param {string} [email=""] your email
        * @param {string} [token=""]  your apikey on profile page
        */

       constructor(email, token) {
           /**
            * @property email your account email
            */
           this.email = email;
           /**
            * @property your account apikey
            */
           this.token = token;
       }

       /**
        * Callback for getting response from https call
        *
        * @callback httpsResponse
        * @param {Error} err -error of https request
        * @param {string|*} body -body of https response
        */
       /**
        *  Get the best server to post in.
        * 
        * The server chosen with this function will have better connection quality.
        * 
        * @async
        * 
        * @param {httpsResponse} callback - handles the https request result
        * 
        */
       getBestServer(callback) {
           fetch(baseUri + "getServer")
               .then(res => {
                   if (res.ok) {
                       res.json().then(json => {
                           callback(null, json);
                       }).catch(error => {
                           console.log(error);
                       });
                   } else {
                       callback(new Error(res.status + ""), null);
                   }
               });

       }

       /**
        *  Get an account info.
        * 
        *  Data returned are : email, account type (e.g. donor, standar), file count, file size.
        * 
        * @async
        * @param {string} [token=null] - someone's token (if null it will use the token setted in the class)
        * @param {httpsResponse} callback - handles the https request result
        * 
        */
       getAccountInfo(token, callback) {
           if (token != null) {
               fetch(baseUri + "getAccountInfo?token=" + token)
                   .then(res => {
                       if (res.ok) {
                           res.json().then(json => {
                               callback(null, json);
                           }).catch(error => {
                               console.log(error);
                           });
                       } else {
                           callback(new Error(res.status + ""), null);
                       }
                   });
           } else {
               fetch(baseUri + "getAccountInfo?token=" + this.token)
                   .then(res => {
                       if (res.ok) {
                           res.json().then(json => {
                               callback(null, json);
                           }).catch(error => {
                               console.log(error);
                           });
                       } else {
                           callback(new Error(res.status + ""), null);
                       }
                   });
           }


       }
       /**
        *  Get an account upload list.
        * 
        *  Data returned are all upload with all data of file uploaded.
        * 
        * @async
        * @param {string} [token=null] - someone's token (if null it will use the token setted in the class)
        * @param {httpsResponse} callback - handles the https request result
        * 
        */
       getUploadList(token, callback) {
           if (token != null) {
               fetch(baseUri + "getUploadsList?token=" + token)
                   .then(res => {
                       if (res.ok) {
                           res.json().then(json => {
                               callback(null, json);
                           }).catch(error => {
                               console.log(error);
                           });
                       } else {
                           callback(new Error(res.status + ""), null);
                       }
                   });
           } else {
               fetch(baseUri + "getUploadsList?token=" + this.token)
                   .then(res => {
                       if (res.ok) {
                           res.json().then(json => {
                               callback(null, json);
                           }).catch(error => {
                               console.log(error);
                           });
                       } else {
                           callback(new Error(res.status + ""), null);
                       }
                   });
           }

       }
       /**
        *  Delete ALL upload by name of a file.
        * 
        *  It delete all upload containing the file name.
        * 
        * @async
        * @param {string} [name=null] - name of the file (if null it delete all upload)
        * @param {srting} [code = null] -code of specific upload (if null it delete all upload with the file inside)
        * @param {string} [token=null] - someone's token (if null it will use the token setted in the class)
        * @param {httpsResponse} callback - handles the https request result
        * 
        */
       deleteUpload(name, code, token, callback) {

           let found = false;
           if (token != null) {
               this.getUploadList(token, (err, body) => {
                   if (err == null) {
                       for (let upload in body.data) {
                           if (code == null) {
                               for (let file in body.data[upload].files) {
                                   if (name != null) {
                                       if (body.data[upload].files[file].name == name) {
                                           found = true;
                                       }
                                   } else {
                                       found = true;
                                   }

                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteUpload?c=" + body.data[upload].code + "&ac=" + body.data[upload].adminCode + "&removeAll=true")
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {

                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                                   found = false;
                               }
                           } else if (code == body.data[upload].code) {
                               for (let file in body.data[upload].files) {
                                   if (name != null) {
                                       if (body.data[upload].files[file].name == name) {
                                           found = true;
                                       }
                                   } else {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteUpload?c=" + body.data[upload].code + "&ac=" + body.data[upload].adminCode + "&removeAll=true")
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                               }
                           }
                       }
                   } else {
                       callback(err, null);
                   }
               });
           } else {
               this.getUploadList(this.token, (err, body) => {
                   if (err == null) {
                       for (let upload in body.data) {
                           if (code == null) {
                               for (let file in body.data[upload].files) {
                                   if (name != null) {
                                       if (body.data[upload].files[file].name == name) {
                                           found = true;
                                       }
                                   } else {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteUpload?c=" + body.data[upload].code + "&ac=" + body.data[upload].adminCode + "&removeAll=true")
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                                   found = false;
                               }
                           } else if (code == body.data[upload].code) {
                               for (let file in body.data[upload].files) {
                                   if (name != null) {
                                       if (body.data[upload].files[file].name == name) {
                                           found = true;
                                       }
                                   } else {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteUpload?c=" + body.data[upload].code + "&ac=" + body.data[upload].adminCode + "&removeAll=true")
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                               }
                           }
                       }
                   } else {
                       callback(err, null);
                   }
               });
           }

       }
       /**
        *  Delete ALL file by name of a file.
        * 
        *  It delete all file in an upload or all upload if code of upload is not specified, if the upload have only 1 file use delete upload
        * 
        * @async
        * @param {string} name - name of the file 
        * @param {srting} [code = null] -code of specific upload 
        * @param {string} [token = null] - someone's token (if null it will use the token setted in the class)
        * @param {httpsResponse} callback - handles the https request result
        * 
        */
       deleteFile(name, code, token, callback) {

           let found = false;
           if (token != null) {
               this.getUploadList(token, (err, body) => {
                   if (err == null) {
                       for (let upload in body.data) {
                           if (code == null) {
                               for (let file in body.data[upload].files) {
                                   if (body.data[upload].files[file].name == name) {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteFile?c=" + body.data[upload].code + "&file=" + name + "&ac=" + body.data[upload].adminCode + "&token=" + token)
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {

                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                                   found = false;
                               }
                           } else if (code == body.data[upload].code) {
                               for (let file in body.data[upload].files) {
                                   if (body.data[upload].files[file].name == name) {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteFile?c=" + body.data[upload].code + "&file=" + name + "&ac=" + body.data[upload].adminCode + "&token=" + token)
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                               }
                           }
                       }
                   } else {
                       callback(err, null);
                   }
               });
           } else {
               this.getUploadList(this.token, (err, body) => {
                   if (err == null) {
                       for (let upload in body.data) {
                           if (code == null) {
                               for (let file in body.data[upload].files) {
                                   if (body.data[upload].files[file].name == name) {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteFile?c=" + body.data[upload].code + "&file=" + name + "&ac=" + body.data[upload].adminCode + "&token=" + this.token)
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                                   found = false;
                               }
                           } else if (code == body.data[upload].code) {
                               for (let file in body.data[upload].files) {
                                   if (body.data[upload].files[file].name == name) {
                                       found = true;
                                   }
                               }
                               if (found) {
                                   fetch("https://" + body.data[upload].server + ".gofile.io/deleteFile?c=" + body.data[upload].code + "&file=" + name + "&ac=" + body.data[upload].adminCode + "&token=" + this.token)
                                       .then(res => {
                                           if (res.ok) {
                                               res.json().then(json => {
                                                   callback(null, json);
                                               }).catch(error => {
                                                   console.log(error);
                                               });
                                           } else {
                                               callback(new Error(res.status + ""), null);
                                           }
                                       });
                               }
                           }
                       }
                   } else {
                       callback(err, null);
                   }
               });
           }

       }
       /**
        * Upload one file on a specific server with multipart/form-data.
        * If you specify the adminCode of an existing upload, then the file will be added to this upload.
        * 
        * @param {file} file -Must contain one file.
        * @param {string} [ac=""] -The admin code of an upload. If you specify it, the file will be added to this upload.
        * @param {string} [email=""] -Must contain email adress syntax. The upload will be stored on this account. if is null it take the email assigned to the class in the consrtuctor or using setter 
        * @param {string} [description=""] -Must contain description of the upload 
        * @param {string} [password =""] -Must contain password of the upload(min 6 char)
        * @param {string} [tags=""] -Must contain tags of the upload. If multiple tags, seperate them with comma (example : tags1,tags2)
        * @param {string} [expire=""] -Must contain expiration date of the upload in the form of timestamp.
        * @param {string} server -the server to upload the file in 
        * @param {httpsResponse} callback - handles the https request result
        */
       postUpload(file, ac, email, description, password, tags, expire, server, callback) {
           var formData = new FormData();
           formData.append('file', file);
           formData.append('ac', ac);
           if (email != null) {
               formData.append('email', email);
           } else {
               formData.append('email', this.email);
           }

           formData.append('description', description);
           formData.append('password', password);
           formData.append('tags', tags);
           formData.append('expire', expire);

           // @ts-ignore
           fetch("https://" + server + ".gofile.io/uploadFile", {
                   method: 'POST',
                   body: formData
               })
               .then(function (res) {
                   return res.json();
               }).then(function (json) {
                   callback(null, json);
               });
       }
       /**
        *  setter of email
        * 
        *  @param {string} email
        * 
        */
        set setEmail(email) {
           this.email = email;
       }
       /**
        *  getter of email
        * 
        *  @return {string} email
        * 
        */
       get getEmail() {
           return this.email;
       }
       /**
        *  setter of token
        * 
        *  @param {string} token
        * 
        */
       set setToken(token) {
        this.token = token;
        }
        /**
         *  getter of token
         * 
         *  @return {string} token
         * 
         */
        get getToken() {
            return this.token;
        }
   }

module.exports.apiGofile = apiGofile;