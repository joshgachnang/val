declare global {
  interface Number {
    toFraction(): string;
  }

  interface String {
    fractionToNumber(): number;
    toStringFraction(): string;
    toUnicodeFraction(): string;
  }

  interface Array<T> {
    flatten(): any[];
  }
}

export function extensionSetup() {
  function gcd(a: number, b: number): number {
    if (b) return gcd(b, a % b);
    return Math.abs(a);
  }

  Number.prototype.toFraction = function (): string {
    let n = this;
    // console.log("N", n);
    let prec = 64; // smallest fraction is 1/64
    let s = String(this);
    let p = s.indexOf(".");
    if (p === -1) {
      return s;
    }

    let i = Math.floor(n) || 0;
    let dec = s.substring(p);
    let num = Math.ceil(Number(dec) * prec);
    let den = prec;
    let g = gcd(num, den);

    if (den / g === 1) {
      return String(i + (num / g));
    }

    let out = "";
    if (i) {
      out = i + " ";
    }
    return out + String(num / g) + "/" + String(den / g);
  };

  String.prototype.fractionToNumber = function(): number {
    let wholeNumber = 0;
    let fraction = this;
    if (fraction.trim().indexOf(" ") > -1) {
      wholeNumber = Number(fraction.split(" ")[0]);
      fraction = fraction.split(" ")[1];
    }
    let num = parseInt(fraction.split("/")[0]);
    let den = parseInt(fraction.split("/")[1]);
    if (num && den) {
      return wholeNumber + (num / den);
    } else {
      return wholeNumber;
    }
  };

  String.prototype.toStringFraction = function(): string {
    let fraction = this;
    fraction = fraction.replace("½", "1/2");
    fraction = fraction.replace("⅓", "1/3");
    fraction = fraction.replace("⅔", "2/3");
    fraction = fraction.replace("¼", "1/4");
    fraction = fraction.replace("¾", "3/4");
    fraction = fraction.replace("⅕", "1/5");
    fraction = fraction.replace("⅖", "2/5");
    fraction = fraction.replace("⅗", "3/5");
    fraction = fraction.replace("⅘", "4/5");
    fraction = fraction.replace("⅙", "1/6");
    fraction = fraction.replace("⅐", "1/7");
    fraction = fraction.replace("⅛", "1/8");
    fraction = fraction.replace("⅜", "3/8");
    fraction = fraction.replace("⅝", "5/8");
    fraction = fraction.replace("⅞", "7/8");
    fraction = fraction.replace("⅑", "1/9");
    fraction = fraction.replace("⅒", "1/10");
    return fraction;
  };

  String.prototype.toUnicodeFraction = function(): string {
    let fraction = this;
    fraction = fraction.replace("1/2", "½");
    fraction = fraction.replace("1/3", "⅓");
    fraction = fraction.replace("2/3", "⅔");
    fraction = fraction.replace("1/4", "¼");
    fraction = fraction.replace("3/4", "¾");
    fraction = fraction.replace("1/5", "⅕");
    fraction = fraction.replace("2/5", "⅖");
    fraction = fraction.replace("3/5", "⅗");
    fraction = fraction.replace("4/5", "⅘");
    fraction = fraction.replace("1/6", "⅙");
    fraction = fraction.replace("1/7", "⅐");
    fraction = fraction.replace("1/8", "⅛");
    fraction = fraction.replace("3/8", "⅜");
    fraction = fraction.replace("5/8", "⅝");
    fraction = fraction.replace("7/8", "⅞");
    fraction = fraction.replace("1/9", "⅑");
    fraction = fraction.replace("1/10", "⅒");
    return fraction;
  };

  Array.prototype.flatten = function(): any[] {
    return this.reduce(
      (a, b) => a.concat(Array.isArray(b) ? this.flatten(b) : b)
    );
  };
}
