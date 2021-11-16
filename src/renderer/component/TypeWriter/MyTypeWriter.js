import React from 'react';
import TypeWriterEffect from "./index";

export const MyTypeWriter = () => {
    return (
        <TypeWriterEffect
            textStyle={{
                fontFamily: 'serif',
                color: '#F87911',
                fontWeight: 800,
                fontSize: '2em',
            }}
            startDelay={2000}
            cursorColor="#F87911"
            multiText={[
                'み ん な で 叶 え た 物 語',
                'LoveLive! μ\'sic forever !!',
                'LoveLive Music Player',
            ]}
            locale={'ja'}
            hideCursorAfterText={true}
            multiTextDelay={2000}
            typeSpeed={100}
        />
    )
}
