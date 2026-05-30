/*
 * DNA Origami Bending Angle Calculator
 * ------------------------------------
 * Standalone browser implementation of the mechanical optimization routine
 * used by the Tools & Software calculator UI.
 */
(function () {
	"use strict";

	var SCHEME_CONFIGS = {
		"Scheme A": function (Nbp, bp1) {
			return {
				n: [Nbp + bp1, Nbp + bp1, Nbp - bp1, Nbp - bp1, Nbp, Nbp],
				delta: [Math.sqrt(3), Math.sqrt(3), -Math.sqrt(3), -Math.sqrt(3), 0, 0]
			};
		},
		"Scheme B": function (Nbp, bp1) {
			return {
				n: [Nbp + 2 * bp1, Nbp + bp1, Nbp - bp1, Nbp - 2 * bp1, Nbp - bp1, Nbp + bp1],
				delta: [2, 1, -1, -2, -1, 1]
			};
		}
	};
	var BENDING_LOG_COLUMNS = [
		{ label: "Angle", width: 8 },
		{ label: "Stretch Energy (J)", width: 24 },
		{ label: "Bending Energy (J)", width: 24 },
		{ label: "Total Energy (J)", width: 20 }
	];

	function formatSigFigs(number, sigFigs) {
		if (number === 0) {
			return "0.000";
		}

		var formattedNumber = Number(number).toPrecision(sigFigs);
		if (formattedNumber.indexOf("e") !== -1) {
			var parts = formattedNumber.split("e"),
				base = parts[0],
				exponent = parts[1],
				sign = exponent.charAt(0) === "-" || exponent.charAt(0) === "+" ? exponent.charAt(0) : "+",
				digits = exponent.replace(/^[-+]/, "");

			if (base.indexOf(".") === -1) {
				base += ".";
			}
			while (base.length - 1 < sigFigs) {
				base += "0";
			}
			while (digits.length < 2) {
				digits = "0" + digits;
			}
			return base + "e" + sign + digits;
		}

		var decimalPoint = formattedNumber.indexOf(".") !== -1;
		while ((formattedNumber.slice(decimalPoint ? 1 : 0).match(/0/g) || []).length < sigFigs - 1) {
			formattedNumber += decimalPoint ? "0" : ".0";
			decimalPoint = true;
		}
		return formattedNumber;
	}

	function parseAngleNumber(id) {
		var field = document.getElementById(id),
			value = Number(field.value),
			label = field.getAttribute("data-label") || id;

		if (!Number.isFinite(value)) {
			throw new Error(label + " must be a valid number.");
		}
		return value;
	}

	function parseAngleInteger(id) {
		var field = document.getElementById(id),
			value = Number(field.value),
			label = field.getAttribute("data-label") || id;

		if (!Number.isInteger(value)) {
			throw new Error(label + " must be a whole number.");
		}
		return value;
	}

	function formatPaddedRow(values, columns) {
		return values.map(function (value, index) {
			return String(value).padEnd(columns[index].width);
		}).join("");
	}

	function buildSeparator(columns) {
		return columns.map(function (column) {
			return "".padEnd(column.width, "-");
		}).join("");
	}

	function buildEnergyMatrixLog(helixTotalEnergy, angleInDegrees, helixStretchEnergy, helixBendingEnergy) {
		var helixEnergyTotal = helixStretchEnergy + helixBendingEnergy;

		helixTotalEnergy.push(helixEnergyTotal);
		return formatPaddedRow([
			angleInDegrees,
			formatSigFigs(helixStretchEnergy, 3),
			formatSigFigs(helixBendingEnergy, 3),
			formatSigFigs(helixEnergyTotal, 6)
		], BENDING_LOG_COLUMNS);
	}

	function calculateBendingAngle() {
		parseAngleNumber("angle-D");
		parseAngleNumber("angle-kb");
		parseAngleInteger("angle-T");

		var Lds = parseAngleNumber("angle-Lds"),
			S = parseAngleNumber("angle-S"),
			B = parseAngleNumber("angle-B"),
			Nds = parseAngleInteger("angle-Nds"),
			Nbp = parseAngleInteger("angle-Nbp"),
			bp1 = parseAngleInteger("angle-bp1"),
			deltaCoefficient = parseAngleNumber("angle-delta-coefficient"),
			bendingScheme = document.getElementById("angle-scheme").value,
			LArc = Nbp * Lds,
			config,
			n,
			delta;

		if (Nds !== 6) {
			throw new Error("Scheme A and Scheme B are defined for Nds = 6 helices.");
		}

		config = (SCHEME_CONFIGS[bendingScheme] || SCHEME_CONFIGS["Scheme A"])(Nbp, bp1);
		n = config.n;
		delta = config.delta;

		if (n.some(function (basePairs) { return basePairs <= 0; })) {
			throw new Error("All helix base-pair counts must remain positive.");
		}

		delta = delta.map(function (value) {
			return value * deltaCoefficient;
		});

		var helixTotalEnergy = [],
			rows = [
				formatPaddedRow(BENDING_LOG_COLUMNS.map(function (column) {
					return column.label;
				}), BENDING_LOG_COLUMNS),
				buildSeparator(BENDING_LOG_COLUMNS)
			];

		for (var angleInDegrees = 1; angleInDegrees <= 360; angleInDegrees += 1) {
			var angleInRadians = angleInDegrees / 180.0 * Math.PI,
				rref = LArc / angleInRadians,
				helixStretchEnergy = 0,
				helixBendingEnergy = 0;

			for (var i = 0; i < Nds; i += 1) {
				var d = (Number(Nbp) / n[i]) * Number(Lds) * (delta[i] / rref + 1);
				helixStretchEnergy += 0.5 * S * n[i] * Math.pow(d - Lds, 2) / Lds;
				helixBendingEnergy += 0.5 * B * n[i] * Lds / Math.pow(rref + delta[i], 2);
			}

			rows.push(buildEnergyMatrixLog(helixTotalEnergy, angleInDegrees, helixStretchEnergy, helixBendingEnergy));
		}

		var minimumIndex = 0;
		for (var energyIndex = 1; energyIndex < helixTotalEnergy.length; energyIndex += 1) {
			if (helixTotalEnergy[energyIndex] < helixTotalEnergy[minimumIndex]) {
				minimumIndex = energyIndex;
			}
		}

		return {
			angle: minimumIndex + 1,
			scheme: bendingScheme,
			log: rows.join("\n")
		};
	}

	function renderBendingAngleCalculation() {
		var result = document.getElementById("angle-result"),
			log = document.getElementById("angle-output-log");

		try {
			var calculation = calculateBendingAngle();
			result.classList.remove("alert-secondary", "alert-warning");
			result.classList.add("alert-success");
			result.innerHTML = '<div class="angle-value">' + calculation.angle + '&deg;</div><div>Optimal bending angle for ' + calculation.scheme + '</div>';
			log.textContent = calculation.log;
		} catch (error) {
			result.classList.remove("alert-secondary", "alert-success");
			result.classList.add("alert-warning");
			result.textContent = error.message;
			log.textContent = "";
		}
	}

	function copyBendingCitation() {
		var citation = document.getElementById("bending-bibtex").innerText,
			button = document.getElementById("copy-bending-bibtex"),
			originalHtml = button.innerHTML,
			setCopied = function () {
				button.innerHTML = '<i class="fa-solid fa-check me-2"></i>Copied';
				window.setTimeout(function () {
					button.innerHTML = originalHtml;
				}, 1800);
			},
			setCopyUnavailable = function () {
				button.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Copy failed';
				window.setTimeout(function () {
					button.innerHTML = originalHtml;
				}, 1800);
			},
			copyWithSelection = function () {
				var textArea = document.createElement("textarea"),
					copied;

				textArea.value = citation;
				textArea.style.position = "fixed";
				textArea.style.left = "-9999px";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				try {
					copied = document.execCommand("copy");
				} catch (error) {
					copied = false;
				}
				document.body.removeChild(textArea);
				return copied;
			};

		if (copyWithSelection()) {
			setCopied();
			return;
		}

		if (window.navigator && window.navigator.clipboard && window.isSecureContext) {
			window.navigator.clipboard.writeText(citation).then(setCopied).catch(setCopyUnavailable);
			return;
		}

		setCopyUnavailable();
	}

	function initDnaBendingCalculator() {
		var calculateButton = document.getElementById("angle-calculate"),
			copyButton = document.getElementById("copy-bending-bibtex");

		if (calculateButton) {
			calculateButton.addEventListener("click", renderBendingAngleCalculation);
		}

		if (copyButton) {
			copyButton.addEventListener("click", copyBendingCitation);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initDnaBendingCalculator);
	} else {
		initDnaBendingCalculator();
	}
}());
