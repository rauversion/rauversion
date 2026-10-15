require "rails_helper"

RSpec.describe ChileanRut do
  describe ".valid?" do
    ["12.345.678-5", "12345678-5", "123456785", "6.000.000-k", "10.000.004-0", " 12.345.678-5 ", "1.000.000-9"].each do |rut|
      it "accepts #{rut.inspect}" do
        expect(described_class.valid?(rut)).to be(true)
      end
    end

    [nil, "", "12.345.678-4", "6.000.000-0", "0-0", "1-1", "1-9", "19", "0000001-9", "00000001-9", "999999-K", "0999999-K", "12345678", "123456789-2", "12A345678-5"].each do |rut|
      it "rejects #{rut.inspect}" do
        expect(described_class.valid?(rut)).to be(false)
      end
    end
  end

  it "normalizes punctuation, whitespace and lowercase K" do
    expect(described_class.normalize(" 6.000.000-k ")).to eq("6000000-K")
  end
end
