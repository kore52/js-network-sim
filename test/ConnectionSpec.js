
describe('Connection class', function() {
  describe('connect()', function() {
    it('should be put Interface in', function() {
      var conn = new Connection()
      expect(conn.connect(new Interface('eth0'))).to.equal(true)
    })

    it('should throw an Error if you try to not put Interface in', function() {
      var conn = new Connection()
      expect(function() { conn.connect() }).to.throw(Error)
    })
  })


  describe('disconnect()', function() {
    it('should throw an Error if you try to put an object what is not an interface in an argument', function() {
      var conn = new Connection()
      expect(function() { conn.disconnect([]) }).to.throw(Error)
    })

    it('should return true if you try to put an interface object is already connected', function() {
      var conn = new Connection()
      var if1 = new Interface('eth0')
      conn.connect(if1)
      expect(conn.disconnect(if1)).to.equal(true)
    })

    it('should throw an Error if you try to put an interface object is not connected', function() {
      var conn = new Connection()
      conn.connect(new Interface('eth0'))
      expect(function() { conn.disconnect(new Interface('eth1')) }).to.throw(Error)
    })
  })


  describe('transfer()', function() {
    it('should call LayerXDevice.receive() function', function() {
      var conn = new Connection()
      var if1 = new Interface('eth0')
      if1.device = {}
      if1.device.receive = function(dest, data) {
        return true
      }
      var if2 = new Interface('eth0')
      if2.device = {}
      if2.device.receive = function(dest, data) {
        return true
      }
      conn.connect(if1)
      conn.connect(if2)
      expect(conn.transfer(if1, {})).to.equal(true)
      expect(conn.transfer(if2, {})).to.equal(true)
    })
  })


})
