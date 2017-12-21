import {extensionSetup} from "./extensions";

describe("string extensions;", () => {
  beforeAll(() => {
    extensionSetup();
  });

  it("whole numbers to fraction", () => {
    let i = 1;
    expect(i.toFraction()).toEqual("1");
  });

  it("convert to fraction 1 1/2", () => {
    expect((1.5).toFraction()).toEqual("1 1/2");
  });

  it("convert to fraction 1/64", () => {
    expect((2.015625).toFraction()).toEqual("2 1/64");
  });

  it("fraction to number", () => {
    expect("7/8".fractionToNumber()).toEqual(0.875);
  });

  it("whole number and fraction to number", () => {
    expect("1 7/8".fractionToNumber()).toEqual(1.875);
  });

  it("to unicode fraction", () => {
    expect("7/8".toUnicodeFraction()).toEqual("⅞");
  });

  it("to string fraction", () => {
    expect("⅑".toStringFraction()).toEqual("1/9");
  });
});

describe("number extensions;", () => {
  beforeAll(() => {
    extensionSetup();
  });
  it("convert to fraction 3/4", () => {
    expect((0.75).toFraction()).toEqual("3/4");
  });
});
