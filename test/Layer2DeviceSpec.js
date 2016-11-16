describe('Layer2Device Class', function() {

  describe('constructor', function() {
    it('should return true if you set Array(Interface) in first argument', function() {
      expect(function() { new Layer2Device([new Interface('eth0')]) }).to.not.throw(Error)
    })

    it('should throw an Error if you set NOT ARRAY in first argument', function() {
      expect(function() { new Layer2Device( new Interface('eth0') ) }).to.throw(Error)
    })

    it('should throw an Error if you set callback function in second arugment', function() {
      var dev0 = new Layer2Device([new Interface('eth0')], function(){return true})
      expect(dev0.receiveCallback).to.be.a('function')
    })

    it('should throw an Error if you set a non-function object in second argument', function() {
      expect(function() { new Layer2Device([new Interface('eth0')], []) }).to.throw(Error)
    })

    it('should throw an Error if you set not Array(Interface) in first argument', function() {
      expect(function() { new Layer2Device([0, 1, 2])}).to.throw(Error)
    })
  })


  describe('setMAC()', function() {
    it('should return this if you set an non-interface object', function() {
      expect(function() { new Layer2Device([new Interface('eth0')]).setMAC('mac!') }).to.throw(Error)
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


  describe('_processVlan()', function() {
    it('should through data if condition is: src[access,vid:1] <---> dest[access,vid:1]', function() {
      var dev0 = new Layer2Device([new Interface('eth0'), new Interface('eth1')])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[access,vid:2] <---> dest[trunk,vid:2]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2), new Interface('eth1', 2, true)])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[access,vid:2] <---> dest[trunk,vid:2/allow[1,2,3]]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2), new Interface('eth1', 2, true, [1,2,3])])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[trunk,vid:2] <---> dest[access,vid:2]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true), new Interface('eth1', 2)])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[trunk,vid:2] <---> dest[trunk,vid:2]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true), new Interface('eth1', 2, true)])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[trunk,vid:2/allow[1,2,3]] <---> dest[access,vid:2]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true, [1,2,3]), new Interface('eth1', 2)])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.ok
    })

    it('should through data if condition is: src[trunk,vid:2/allow[1,2,3]] <---> dest[trunk,vid:2/allow[1,2,3]]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true, [1,2,3]), new Interface('eth1', 2, true, [1,2,3])])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.ok
    })

    it('should discard frames if condition is: src[access,vid:2] --X-- dest[trunk,vid:2/allow[3]]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2), new Interface('eth1', 3, true, [3])])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'data': 'dummy'})).to.be.undefined
    })

    it('should discard frames if condition is: src[trunk,vid:2] --X-- dest[trunk,vid:3/allow[3]]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true), new Interface('eth1', 3, true, [3])])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.undefined
    })

    it('should discard frames if condition is: src[trunk,vid:2] --X-- dest[access,vid:3]', function() {
      var dev0 = new Layer2Device([new Interface('eth0', 2, true), new Interface('eth1', 3)])
      expect(dev0._processVlan(dev0.getInterface('eth0'), dev0.getInterface('eth1'), {'vid': 2, 'data': 'dummy'})).to.be.undefined
    })

    it('should throw an Error if you do not set any arguments', function() {
      var dev0 = new Layer2Device([new Interface('eth0'), new Interface('eth1')])
      expect(function() { dev0._processVlan(dev0.getInterface('eth0'), undefined, {'data': 'dummy'}) }).to.throw(Error)
      expect(function() { dev0._processVlan(undefined, dev0.getInterface('eth0'), {'data': 'dummy'}) }).to.throw(Error)
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


  describe('simple transferring of layer2 frame', function() {

    it('dev0 -> sw -> dev1', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw = new Layer2Device([new Interface('port0'), new Interface('port1')])


      dev0.connect('eth0', sw.getInterface('port0'))
      dev1.connect('eth0', sw.getInterface('port1'))
      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.ok
    })

    it('dev0[eth0] -> sw0[port0]=>[port1] -> sw1[port0]=>[port1] -> dev1[eth0]', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw0 = new Layer2Device([new Interface('port0'), new Interface('port1')])
      var sw1 = new Layer2Device([new Interface('port0'), new Interface('port1')])


      dev0.connect('eth0', sw0.getInterface('port0'))
      sw0.connect('port1', sw1.getInterface('port0'))
      dev1.connect('eth0', sw1.getInterface('port1'))
      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.ok
    })

    it('should broadcast frames', function() {
      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw = new Layer2Device([new Interface('port0'), new Interface('port1')])


      dev0.connect('eth0', sw.getInterface('port0'))
      dev1.connect('eth0', sw.getInterface('port1'))
      expect(dev0.send('eth0', new MAC('ff-ff-ff-ff-ff-ff'), 'testdata')).to.be.ok
    })
  })

  describe('Transferring of frames with VLAN', function() {

    it('should be transferred if condition is: dev0 <-> sw0[port0/vid:10] <-> [port1/vid:10] <-> dev1', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw0 = new Layer2Device([new Interface('port0', 10), new Interface('port1', 10)])

      dev0.connect('eth0', sw0.getInterface('port0'))
      dev1.connect('eth0', sw0.getInterface('port1'))

      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.ok
      expect(dev1.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata')).to.be.ok
    })

    it('should NOT be transferred if condition is: dev0 --- sw0[port0/vid:10] --- [port1/vid:20] --- dev1', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw0 = new Layer2Device([new Interface('port0', 10), new Interface('port1', 20)])

      dev0.connect('eth0', sw0.getInterface('port0'))
      dev1.connect('eth0', sw0.getInterface('port1'))

      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.undefined
      expect(dev1.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata')).to.be.undefined
    })

    it('should be transferred if condition is: dev0 --- sw0[port0/vid:10/access]=[port1/vid:10/trunk] --- sw1[port0/vid:10/trunk]=[port1/vid:10/access] --- dev1', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw0 = new Layer2Device([new Interface('port0', 10), new Interface('port1', 10, true)])
      var sw1 = new Layer2Device([new Interface('port0', 10, true), new Interface('port1', 10)])

      dev0.connect('eth0', sw0.getInterface('port0'))
      sw0.connect('port1', sw1.getInterface('port0'))
      dev1.connect('eth0', sw1.getInterface('port1'))

      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.ok
      expect(dev1.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata')).to.be.ok
    })


    it('should be transferred if condition is: dev0 --- sw0[port0/vid:10/access]=[port1/vid:10/trunk] --- sw1[port0/vid:10/trunk]=[port1/vid:10/trunk] --- sw2[port0/vid:10/trunk]=[port1/vid:10/access] --- dev1', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      var dev1 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-bb-00-00-00-01')]])

      var sw0 = new Layer2Device([new Interface('port0', 10), new Interface('port1', 10, true)])
      var sw1 = new Layer2Device([new Interface('port0', 10, true), new Interface('port1', 10, true)])
      var sw2 = new Layer2Device([new Interface('port0', 10, true), new Interface('port1', 10)])

      dev0.connect('eth0', sw0.getInterface('port0'))
      sw0.connect('port1', sw1.getInterface('port0'))
      sw1.connect('port1', sw2.getInterface('port0'))
      dev1.connect('eth0', sw2.getInterface('port1'))

      expect(dev0.send('eth0', new MAC('00-bb-00-00-00-01'), 'testdata')).to.be.ok
      expect(dev1.send('eth0', new MAC('00-aa-00-00-00-01'), 'testdata')).to.be.ok
    })
  })


  describe('connect()', function() {

    it('should connect to other device', function() {
      var dev0 = new Layer2Device([new Interface('eth0')])
      var dev1 = new Layer2Device([new Interface('eth0')])
      expect(dev0.connect('eth0', dev1.getInterface('eth0'))).to.be.ok
    })

    it('should throw an Error if you set an argument except for string', function() {
      var dev0 = new Layer2Device([new Interface('eth0')])
      expect(function() { dev0.connect([]) }).to.throw(Error)
    })

    it('should throw an Error if you do not set an Interface object to second argument', function() {
      var dev0 = new Layer2Device([new Interface('eth0')])
      expect(function() { dev0.connect('eth0', []) }).to.throw(Error)
    })
  })

  describe('disconnect()', function() {

    it('should disconnect from other device', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])
      var sw0 = new Layer2Device([new Interface('port0'), new Interface('port1')])
      dev0.connect('eth0', sw0.getInterface('port0'))

      expect(dev0.disconnect('eth0')).to.be.ok
    })

    it('should throw an Error if you set an argument except for string', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])
      var sw0 = new Layer2Device([new Interface('port0'), new Interface('port1')])
      dev0.connect('eth0', sw0.getInterface('port0'))

      expect(function() { dev0.disconnect([]) }).to.throw(Error)
    })

    it('should throw an Error if you set a wrong interface name', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])
      var sw0 = new Layer2Device([new Interface('port0'), new Interface('port1')])
      dev0.connect('eth0', sw0.getInterface('port0'))

      expect(function() { dev0.disconnect('someone') }).to.throw(Error)
    })

    it('shoud throw an Error if you disconnect an interface has no longer connected', function() {

      var dev0 = new Layer2Device([new Interface('eth0')], function(a,frame) { return frame.data })
      .setMAC([['eth0', new MAC('00-aa-00-00-00-01')]])

      expect(function() { dev0.disconnect('eth0') }).to.throw(Error)
    })
  })

  describe('getInterface()', function() {
    var dev0 = new Layer2Device([new Interface('eth0')])
    it('should get an Interface object', function() {
      expect(dev0.getInterface('eth0')).to.be.ok
    })

    it('should get undefined if you set a wrong interface name', function() {
      expect(dev0.getInterface('someone')).to.not.be.ok
    })
  })
})
