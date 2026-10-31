async function PayUPayment(
  url,
  hash,
  email,
  firstname,
  phone,
  txnid,
  productinfo,
  surl,
  furl,
  curl,
  key,
  amount,
  udf1,
  udf2,
  udf3,
  udf4,
  udf5
) {
  let form = document.createElement("form");
  document.body.appendChild(form);
  form.method = "post";
  form.action = url;

  addPaymentFields(form, {
    hash: hash,
    email: email,
    firstname: firstname,
    phone: phone,
    txnid: txnid,
    productinfo: productinfo,
    surl: surl,
    furl: furl,
    curl: curl,
    key: key,
    amount: amount,
    udf1: udf1,
    udf2: udf2,
    udf3: udf3,
    udf4: udf4,
    udf5: udf5,
    displayPaymentMethods: true,
    enforced_paymethod: "creditcard debitcard netbanking upi qr",
  });
  form.submit();
}

function addPaymentFields(parent, childData) {
  const keys = Object.keys(childData);
  keys.forEach((key) => {
    let input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = childData[key];
    parent.appendChild(input);
  });
}
