/* eslint-disable */
import React from 'react';
import './App.css';
const EXTENSION_ID = 'amkjnhmbidmfoolfolmkacnailbbpdna';
import io from 'socket.io-client';
let socket;
let timeout;

class App extends React.PureComponent {
  constructor(props) {
    super(props);

    this.cast = this.cast.bind(this);
    this.watch = this.watch.bind(this);
    this.stream = this.stream.bind(this);
    this.state = {
      isAbleToCast: false,
      watching: false,
      sourceImage: '',
      joinurl: '',
    }
  }

  componentDidMount() {
    socket = io(window.location.origin.replace('3000', '3001'));
    socket.emit('isAbleToBroadcast', null);
    socket.on('joinurl', joinurl => this.setState({joinurl}))
    socket.on('isAbleToBroadcast', isAbleToCast => {
      if (!this.state.isAbleToCast && !isAbleToCast) {
        this.setState({watching: true}, this.watch);
      }

      if (!this.state.isAbleToCast && isAbleToCast) {
        this.setState({isAbleToCast});  
      }
    })
  }

  componentWillUnmount() {
    this.state.isAbleToCast && socket.emit('castoff', null);
    clearTimeout(timeout);
  }

  watch() {
    socket.on('stream', sourceImage => {
      this.setState({sourceImage})
    })
  }

  stream() {
    const context = this.canvas.getContext('2d');

    this.canvas.width = window.screen.width;
    this.canvas.height = window.screen.height;

    const draw = (v,c) => {
      context.drawImage(this.video, 0, 0);
      const dataUrl = this.canvas.toDataURL('image/jpeg', 0.5);
      socket.emit('stream', dataUrl);
      timeout = setTimeout(draw,80,v,c);
    }
    draw.bind(this);
    draw(this.video, context);
  }

  cast() {
    if (!chrome) {
      alert('you need to use latest google chrome version to be a caster!');
      return;
    }

    const request = { sources: ['window', 'screen', 'tab'] };
    chrome.runtime.sendMessage(EXTENSION_ID, 'version', response => {
      if (!response) {
        alert('No extension');
        return;
      }
      console.log('Extension version: ', response.version);
      chrome.runtime.sendMessage(EXTENSION_ID, request, response => {
        if (response && response.type === 'success') {
          navigator.mediaDevices
            .getUserMedia({
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: response.streamId
                }
              }
            })
            .then(returnedStream => {
              this.video.srcObject = returnedStream;
              !this.state.caster && this.stream();
              this.setState({caster: true});
              socket.emit('caston', null);
            })
            .catch(err => {
              console.error('Could not get stream: ', err);
            });
        } else {
          console.error('Could not get stream');
        }
      });
    });
  }

  render() {
    const {isAbleToCast, watching} = this.state;
    return (
      <div className="App">
        {isAbleToCast && <button onClick={this.cast}>Be a caster!</button>}
        {!watching && <p>temenmu suruh join ke http://{this.state.joinurl}</p>}
        <canvas style={{display: 'none'}} ref={node => {this.canvas = node}} />
        <video style={{display: 'none'}} ref={node => {this.video = node}} autoPlay/>
        {this.state.watching && <img src={this.state.sourceImage} style={{width: "100%"}} ref={node => {this.image = node}} />}
      </div>
    );
  }
}

export default App;
