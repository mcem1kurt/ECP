import { StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native'
import React, { useState } from 'react'
import { Modal} from 'react-native-paper';

import { Button } from 'react-native-paper'

const Cars = ({model,brand,uri, carItemSelectedHandler}) => {

    return (
        <>
        
        <TouchableOpacity style={styles.container} onPress={()=>{carItemSelectedHandler(model,brand,uri)}}>
            <Image style={styles.image} source={{ uri: uri }} resizeMode="center" />
            <View style={styles.carDetails}>
                <Text style={styles.brand}>{brand}</Text>
                <Text style={styles.model}>{model}</Text>
            </View>
        </TouchableOpacity>
        
        </>
    )
}

export default Cars

const styles = StyleSheet.create({
    container: {
        marginVertical:10,
        width: "95%",
        alignSelf: "center",
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,

        elevation: 8,
    },
    image: {
        marginLeft:10,
        alignSelf: "center",
        height: '70%',
        width: 70,
        borderRadius:10
    },
    carDetails: {
        justifyContent: "center",
        marginLeft:10,
        padding:8,
    },
    brand: {
        fontSize: 20,
        fontWeight: "500"
    },
    model: {
        fontSize: 16,
        fontWeight: "300"
    }

})