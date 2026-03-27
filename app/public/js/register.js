function isPasswordValid(password) {
  const rules = [
    { pattern: /[A-Z]/, target: "UpperCase" },
    { pattern: /[a-z]/, target: "LowerCase" },
    { pattern: /[0-9]/, target: "Numbers" },
    { pattern: /[!@#$%^&*]/, target: "Symbols" },
  ];

  const isLengthValid = password.length >= 7;

  const ruleResults = rules.map((rule) => ({
    isValid: rule.pattern.test(password),
    target: rule.target,
  }));

  return {
    isValid: isLengthValid && ruleResults.every((rule) => rule.isValid),
    isLengthValid,
    ruleResults,
  };
}

function ValidatePassword() {
  const password = $("#VerifingPassword").val();

  $("#Length").removeClass(
    password.length >= 7 ? "glyphicon-ok" : "glyphicon-remove",
  );
  $("#Length").addClass(
    password.length >= 7 ? "glyphicon-ok" : "glyphicon-remove",
  );

  const rules = [
    { pattern: /[A-Z]/, target: "UpperCase" },
    { pattern: /[a-z]/, target: "LowerCase" },
    { pattern: /[0-9]/, target: "Numbers" },
    { pattern: /[!@#$%^&*]/, target: "Symbols" },
  ];

  rules.forEach((rule) => {
    const isValid = rule.pattern.test(password);
    $("#" + rule.target).removeClass(
      isValid ? "glyphicon-ok" : "glyphicon-remove",
    );
    $("#" + rule.target).addClass(
      isValid ? "glyphicon-ok" : "glyphicon-remove",
    );
  });
}

$(document).ready(function () {
  $("#VerifingPassword").on("keyup", ValidatePassword);

  $("form").on("submit", function (e) {
    const password = $("#VerifingPassword").val();
    const validation = isPasswordValid(password);

    if (!validation.isValid) {
      e.preventDefault();
      alert("Le mot de passe ne respecte pas toutes les règles.");
    }
  });
});

function isPhotoProfilValid(photo_path) {
  return /^https:\/\/[^\s]+\.(jpg|png|webp)$/i.test(photo_path);
}

$(document).ready(function () {
  $("form").on("submit", function (e) {
    const photoPath = $("#pp_link").val();
    console.log("paff : |" + photoPath + "|");
    if (photoPath !== "") {
      if (!isPhotoProfilValid(photoPath)) {
        e.preventDefault();
        alert("Le lien de la photo est invalide.");
        return;
      }
    }
  });
});
