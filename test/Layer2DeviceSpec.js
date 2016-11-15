describe('Layer2Device Class', function() {

  describe('constructor', function() {
    it('should return true if you try to put Array(Interface) in first argument', function() {
      expect(function() { new Layer2Device([new Interface('eth0')]) }).to.not.throw(Error)
    })

    it('should throw an Error if you try to put NOT ARRAY in first argument', function() {
      expect(function() { new Layer2Device( new Interface('eth0') ) }).to.throw(Error)
    })

    it('should set callback function if you try to put Function in second arugment', function() {
      var dev0 = new Layer2Device([new Interface('eth0')], function(){return true})
      expect(dev0.receiveCallback).to.be.a('function')
    })

    it('should throw an Error if you try to put not Array(Interface) in first argument', function() {
      expect(function() { new Layer2Device([0, 1, 2])}).to.throw(Error)
    })
  })


  describe('send() -> receive()', function() {

    var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
    .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])
    var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
    .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])
    dev0.connect('eth0', dev1.getInterface('eth0'))

    it('should send data between two devices', function() {
      expect(dev0.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata')).to.equal('testdata')
      expect(dev1.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.equal('testdata')
    })

    it('should throw an Error if you don\'t put a invalid source port name in first argument', function() {
      expect(function() { dev0.send(null, new MAC('00-aa-00-00-00-01'), 'testdata') }).to.throw(Error)
    })

    it('should throw an Error if you don\'t put a invalid destination mac address in first argument', function() {
      expect(function() { dev0.send('eth0', {}, 'testdata') }).to.throw(Error)
    })

    it('should throw an Error if you don\'t put a invalid source mac address in first argument', function() {
      expect(function() { dev0.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata', {}) }).to.throw(Error)
    })
  })


  describe('_searchPort()', function() {
    it('should get a single mac address', function() {
      var dev0 = new Layer2Device([new Interface('eth0')])
      dev0._addMacTable('eth0', new MAC('00-ff-00-00-00-01'))
      dev0._addMacTable('eth0', new MAC('00-ff-00-00-00-02'))
      var mac = dev0._searchPort(new MAC('00-ff-00-00-00-01'))
      expect(mac).to.be.an('array')
      expect(mac[0].name).to.equal('eth0')
    })
  })
})
