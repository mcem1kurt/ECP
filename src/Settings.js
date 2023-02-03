import { StyleSheet, Alert, View } from 'react-native'
import React from 'react'
import Icon from "react-native-dynamic-vector-icons";
import { Dimensions } from 'react-native';
import { firebase } from '../config'
import { useNavigation } from '@react-navigation/native';



const Settings = () => {
    const navigation = useNavigation()

    const logoutPressHandler = () => {
        Alert.alert(
            "Çıkış Yap",
            "Çıkış yapmak istiyor musunuz?",
            [
                {
                    text: "İptal",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel"
                },
                {
                    text: "Onayla", onPress: async () => {
                        try {
                            await firebase.auth().signOut();
                            navigation.navigate('Login');
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
            ]
        );

    }

    return (
        <View style={{ width: Dimensions.get('window').width, }}>
            <Icon type="SimpleLineIcons" name='logout' color='red' style={styles.logout} onPress={() => { logoutPressHandler() }} />
        </View>
    )
}

export default Settings

const styles = StyleSheet.create({
    logout: {
        alignSelf: "flex-end",
        paddingRight: 20,
        paddingTop: 60,
    }
})