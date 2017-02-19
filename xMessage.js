$( function () {

    function xMessage( target, option ) {
        var self = this;

        this.target = target;
        $.extend( this, { 
            id:      'xmessage', 
            seq:     1, 
            timeout: 10000 
        }, option );
    }

    xMessage.prototype.listener = function( listener, option ) {
        var self = this;

        if ( !this._listener ) {
            $( window ).on( 'message.' + this.id, function ( ev ) { 
                var env = ev.originalEvent.data;

                if ( env.reply ) {
                    if ( self.seq != env.reply ) {
                        console.warn( 'received wrong message', env );
                        self.dfd.reject( new Error( 'wrong message' ) )               
                        return;
                    }

                    self.dfd.resolve( env.body )               
                }
                else {
                    var res;
                    try {
                        res = self._listener( env.body )
                    }
                    catch ( e ) {
                        res = e
                    }
                    self.send( res, { reply: env.seq } )
                }
            } )
        }
        this._listener = listener;
     
        return this;
    }

    xMessage.prototype.send = function( data, option ) {
        var self = this;

        if ( this.dfd && this.dfd.state() == 'pending' ) {
            throw new Error( 'send in progress' )
        }        
        
        this.seq += 1;
        var env = $.extend( {
            seq: this.seq,
            body: data
        }, option );

        this.target.postMessage( env, '*' )
        
        return this.dfd = $.Deferred( function ( d ) {
            setTimeout( function () {
                d.reject( new Error( 'timeout' ) )
            }, self.timeout )            
        } )
    }

} )
