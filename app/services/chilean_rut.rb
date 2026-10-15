class ChileanRut
  def self.normalize(value)
    compact = value.to_s.gsub(/[.\s-]/, "").upcase
    return compact unless compact.match?(/\A\d{1,8}[\dK]\z/)

    "#{compact[0...-1]}-#{compact[-1]}"
  end

  def self.valid?(value)
    normalized = normalize(value)
    return false unless normalized.match?(/\A\d{7,8}-[\dK]\z/)

    body, digit = normalized.split("-")
    return false if body.to_i < 1_000_000

    sum = body.reverse.chars.each_with_index.sum do |number, index|
      number.to_i * (2 + index % 6)
    end
    check_digit = (11 - sum % 11) % 11
    digit == (check_digit == 10 ? "K" : check_digit.to_s)
  end
end
