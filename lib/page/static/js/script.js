const typedTextSpan = document.querySelector(".typed-text"),
    textArray = ["ONLINE", "ENJOY~"],
    typingDelay = 200,
    erasingDelay = 100,
    newTextDelay = 2e3;
let textArrayIndex = 0,
    charIndex = 0;

function type() { charIndex < textArray[textArrayIndex].length ? (typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex), charIndex++, setTimeout(type, 200)) : setTimeout(erase, 2e3) }

function erase() { charIndex > 0 ? (typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1), charIndex--, setTimeout(erase, 100)) : (textArrayIndex++, textArrayIndex >= textArray.length && (textArrayIndex = 0), setTimeout(type, 1300)) }
document.addEventListener("DOMContentLoaded", (function() { setTimeout(type, 2250) }));

$(document).ready((function() {
    $(".changeprofile").submit((function(e) {
        var formObj, formURL = $(this).attr("action"),
            formData = new FormData(this);
        $.ajax({ url: formURL, type: "POST", data: formData, contentType: !1, cache: !1, processData: !1, beforeSend: function() { $("button").attr("disabled", "disabled"), $("input").attr("disabled", "disabled"), $("a").attr("disabled", "disabled"), $(".inibutton").html('<i class="fas fa-spinner fa-spin"></i> Wait') }, success: function(data) { data.includes("Success") ? ($("button").removeAttr("disabled", "disabled"), $("a").removeAttr("disabled", "disabled"), $("input").removeAttr("disabled", "disabled"), $(".inibutton").html("Save"), $.notify({ icon: "tim-icons icon-check-2", message: data }, { type: "success", timer: 3e3, placement: { from: "top", align: "right" } }), window.location = window.location) : ($("button").removeAttr("disabled", "disabled"), $("a").removeAttr("disabled", "disabled"), $("input").removeAttr("disabled", "disabled"), $(".inibutton").html("Save"), $.notify({ icon: "tim-icons icon-simple-remove", message: data }, { type: "danger", timer: 3e3, placement: { from: "top", align: "right" } })) } }), e.preventDefault()
    }))
}))