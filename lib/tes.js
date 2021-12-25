    function chgAction(action, actn, type, pass){        
        if(action.toLowerCase() == "add"){
            document.form_admin.action = "/admin?action=add&acnum="+actn+"&type"+type+"&pass="+pass
        }else if(action.toLowerCase() == "edit"){
            document.form_admin.action = "/admin?action=edit&acnum="+actn+"&type"+type+"&pass="+pass
        }else if(action.toLowerCase() == "delete"){
            document.form_admin.action = "/admin?action=delete&acnum="+actn+"&pass="+pass
        }
    }
    setInterval(() => {
		var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);
    	var action = urlParams.get('action')
    	var type = urlParams.get('acnum')
        if(action.toLowerCase() == "add" || action.toLowerCase() == "edit"){
            chgAction(action === undefined || action === null ? 'add' : action, type === undefined || type === null || isNaN(type) ? '1' : type, document.getElementById("typeanime").value, document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
        }else{
            chgAction('delete', type === undefined || type === null || isNaN(type) ? '1' : type, document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
        }
        console.log(document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
    }, 10)