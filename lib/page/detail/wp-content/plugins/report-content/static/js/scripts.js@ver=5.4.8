jQuery(document).ready(function ($) {
	var clickedButton;
	var currentForm;
	$('.wprc-input').val('');
	$('.wprc-submit').prop("disabled", false);
	$('.wprc-switch').click(function () {
		$(this).siblings('.wprc-content').slideToggle();
	});

	$('.wprc-submit').click(function () {
		clickedButton = $(this);
		currentForm = $(this).parents('.wprc-content');
		var post_id = currentForm.find('.post-id').val();
		var _reason = currentForm.find('.input-reason').val();
		var _details = currentForm.find('.input-details').val();
		var _reporter_name = currentForm.find('.input-name').val();
		var _reporter_email = currentForm.find('.input-email').val();
		clickedButton.prop("disabled", true);
		currentForm.find('.loading-img').show();
		$.ajax({
			type: 'POST',
			url: wprcajaxhandler.ajaxurl,
			data: {
				action: 'wprc_add_report',
				id: post_id,
				reason: _reason,
				details: _details,
				reporter_name: _reporter_name,
				reporter_email: _reporter_email
			},
			success: function (data, textStatus, XMLHttpRequest) {
				currentForm.find('.loading-img').hide();
				data = jQuery.parseJSON(data);
				if (data.success) {
					currentForm.find('.wprc-message').html(data.message).addClass('success');
					currentForm.find('.wprc-form').remove();
				}
				else {
					clickedButton.prop("disabled", false);
					currentForm.find('.wprc-message').html(data.message).addClass('error');
				}
			},
			error: function (MLHttpRequest, textStatus, errorThrown) {
				alert(errorThrown);
			}
		});
	});
});