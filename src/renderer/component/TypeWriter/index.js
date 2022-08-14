import React, {Component, createRef} from 'react';
import {contentInView, delay, propTypeValidation} from './utils';
import './app.css';

class TypeWriterEffect extends Component {
    state = {
        text: '',
        blink: false,
        hideCursor: true,
        animate: false,
        typeSpeedDelay: null,
        multiTextDelay: null,
        eraseSpeedDelay: null,
        startDelay: null,
        scrollAreaIsSet: null,
        multiTextLoop: false
    };

    myRef = createRef();

    multiTextDisplay = async (arr) => {
        for (let e = 0; e < arr.length; e++) {
            await this.runAnimation(arr[e], arr.length - e - 1);
        }
        if (this.props.multiTextLoop) {
            await this.eraseText(arr[arr.length - 1]);
            this.multiTextDisplay(arr);
        }
    };

    runAnimation = async (str, erase) => {
        const textArr = typeof str == 'string' && str.trim().split('');
        if (textArr) {
            this.setState({
                blink: false,
            });
            let text = '';
            const typeSpeedDelay = new delay(this.props.typeSpeed || 120);
            const multiTextDelay =
                this.props.multiText && new delay(this.props.multiTextDelay || 2000);
            this.setState({
                typeSpeedDelay,
                multiTextDelay,
            });
            for (let char = 0; char < textArr.length; char++) {
                await typeSpeedDelay.getPromise();
                text += textArr[char];
                this.setState({
                    text,
                });
            }
            this.setState({
                blink: true,
            });
            this.props.multiText && (await multiTextDelay.getPromise());
            erase > 0 && (await this.eraseText(text));
        }
    };

    eraseText = async (str) => {
        const textArr = typeof str == 'string' && str.trim().split('');
        this.setState({
            blink: false,
        });
        let text = str.trim();
        const eraseSpeedDelay = new delay(50);
        this.setState({
            eraseSpeedDelay,
        });
        for (let char = 0; char < textArr.length; char++) {
            await eraseSpeedDelay.getPromise();
            text = text.slice(0, -1);
            this.setState({
                text,
            });
        }
        this.setState({
            blink: true,
        });
    };

    animateOnScroll = async () => {
        try {
            if (!this.state.animate && contentInView(this.myRef.current)) {
                this.setState({
                    animate: true,
                });
                const startDelay =
                    this.props.startDelay && new delay(this.props.startDelay);
                this.setState({
                    hideCursor: false,
                    startDelay,
                });
                this.props.startDelay && (await startDelay.getPromise());
                this.props.multiText
                    ? await this.multiTextDisplay(this.props.multiText)
                    : await this.runAnimation(this.props.text);

                this.props.hideCursorAfterText &&
                this.setState({
                    hideCursor: true,
                });
            }
        } catch (error) {
        }
    };

    componentDidMount() {
        this.animateOnScroll();
        this.setState({scrollAreaIsSet: false});
    }

    componentDidUpdate() {
        if (!this.state.scrollAreaIsSet) {
            this.setState({scrollAreaIsSet: true});
            this.props.scrollArea && typeof this.props.scrollArea == 'object'
                ? this.props.scrollArea.addEventListener('scroll', this.animateOnScroll)
                : document.addEventListener('scroll', this.animateOnScroll);
        }
    }

    componentWillUnmount() {
        // unsubscribe from timeouts and events
        this.props.scrollArea && typeof this.props.scrollArea == 'object'
            ? this.props.scrollArea.removeEventListener(
                'scroll',
                this.animateOnScroll
            )
            : document.removeEventListener('scroll', this.animateOnScroll);
        this.state.startDelay && this.state.startDelay.cancel();
        this.state.eraseSpeedDelay && this.state.eraseSpeedDelay.cancel();
        this.state.typeSpeedDelay && this.state.typeSpeedDelay.cancel();
        this.state.multiTextDelay && this.state.multiTextDelay.cancel();
    }

    render() {
        return (
            <div ref={this.myRef} className={'react-typewriter-text-wrap'}>
                <h1
                    style={{...this.props.textStyle}}
                    className='react-typewriter-text'
                    lang={this.props.locale}
                >
                    {this.state.text}
                    <div
                        className={`react-typewriter-pointer ${
                            this.state.blink && 'add-cursor-animate'
                        } ${this.state.hideCursor ? 'hide-typing-cursor' : ''}`}
                        style={{backgroundColor: `${this.props.cursorColor}`}}
                    />
                </h1>
            </div>
        );
    }
}

TypeWriterEffect.propTypes = propTypeValidation;

export default TypeWriterEffect;
