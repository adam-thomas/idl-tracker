import React from "react";


export default class AutoSizeTextarea extends React.Component {
    constructor(props) {
        super(props);

        this.ref = React.createRef();

        this.pixels_per_lowercase = 8;
        this.pixels_per_uppercase = 12;

        this.state = {
            element_width: null,
        }
    }

    componentDidMount(){
        this.boundingBox = this.ref.current.getBoundingClientRect();
        this.setState({
            element_width: this.boundingBox.width,
        });
    };

    render() {
        const uppercase_count = (this.props.value.match(/[A-Z]/g) || "").length;
        const lowercase_count = this.props.value.length - uppercase_count;
        const text_width_estimate = (this.pixels_per_uppercase * uppercase_count) + (this.pixels_per_lowercase * lowercase_count);

        const lines_of_text = Math.max(Math.ceil(text_width_estimate / this.state.element_width), 1);
        const height_px = (lines_of_text * 20) + 18;

        return (
            <textarea
                {...this.props}
                ref={this.ref}
                style={{height: `${height_px}px`}}
            />
        );
    }
}
