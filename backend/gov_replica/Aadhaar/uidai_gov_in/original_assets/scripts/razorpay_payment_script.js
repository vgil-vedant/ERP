async function openRazorpayCheckout(key, order_id, amount, notes) {
  notes = JSON.parse(notes);
  var options = {
    key: key,
    image:
      "https://myaadhaar.uidai.gov.in/static/media/aadhaar_english_logo.9a2d6379.svg",
    amount: amount,
    currency: "INR",
    name: "UIDAI",
    description: "Appointment Payment to UIDAI",
    order_id: order_id,
    timeout: 180,
    retry: { enabled: true, max_count: 3 },
    redirect: false,
    handler: function (response) {
      window.useHandlePaymentSuccess(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );
    },
    modal: {
      escape: false,
      handleback: false,
      confirm_close: true,
      ondismiss: function () {
        window.useHandlePaymentCancel();
      },
    },
    prefill: {
      name: notes.name,
      email: notes.emailId,
      contact: notes.mobileNo,
    },
    notes: notes,
    theme: {
      color: "#1e6bea",
    },
  };
  var razorpayInstance = new Razorpay(options);
  razorpayInstance.on("payment.failed", function (response) {
    window.useHandlePaymentFailure(
      response.error.code,
      response.error.description
    );
  });
  razorpayInstance.open();
}
