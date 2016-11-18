
describe('IPv4 Class', function() {
  describe('constructor', function() {
    it('should set null or undefined', function() {
      expect(new IPv4(null)).to.be.ok
      expect(new IPv4(undefined)).to.be.ok
    })

    it('should set an IPv4 format string', function() {
      expect(new IPv4('0.0.0.0')).to.be.ok
      expect(new IPv4('000.000.000.000')).to.be.ok
      expect(new IPv4('255.255.255.255')).to.be.ok
    })

    it('should set an integer', function() {
      expect(new IPv4(0)).to.be.ok
      expect(new IPv4(0xffffffff)).to.be.ok
    })

    it('should set an IPv4 instance', function() {
      expect(new IPv4(new IPv4(0))).to.be.ok
    })
  })
})