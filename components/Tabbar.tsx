import React from 'react';
  import {
    Alert,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
  } from 'react-native';
  import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
  import Ionicons from 'react-native-vector-icons/Ionicons';
  import { NavigationContainer } from '@react-navigation/native';
  import Map from '../src/Map';
import Profile from '../src/Profile';
import Settings from '../src/Settings';


  const TabBar = ({currentUser,setIsActive}) => {
    const _renderIcon = (routeName: string, selectedTab: string) => {
      let icon = '';

      switch (routeName) {
        case 'title1':
          icon = 'ios-home-outline';
          break;
        case 'title2':
          icon = 'settings-outline';
          break;
      }

      return (
        <Ionicons
          name={icon}
          size={25}
          color={routeName === selectedTab ? '#F8A300' : 'gray'}
        />
      );
    };
    const renderTabBar = ({ routeName, selectedTab, navigate }: any) => {
      return (
        <TouchableOpacity
          onPress={() => {
            navigate(routeName)
          }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {_renderIcon(routeName, selectedTab)}
        </TouchableOpacity>
      );
    };

    return (
      <View style={{ flex: 1 }}>
        <NavigationContainer independent={true}>
          <CurvedBottomBar.Navigator
            style={styles.bottomBar}
            strokeWidth={0.5}
            strokeColor="#DDDDDD"
            height={65}
            circleWidth={55}
            bgColor="white"
            initialRouteName="title3"
            borderTopLeftRight
            renderCircle={({ routeName, navigate, selectedTab }) => (
              <Animated.View style={styles.btnCircle}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                  }}
                  onPress={() => navigate(routeName)}>
                  <Ionicons name={'map-outline'}  size={25}  color={routeName === selectedTab ? '#F8A300' : 'gray'}/>
                </TouchableOpacity>
              </Animated.View>
            )}
            tabBar={renderTabBar}>
            <CurvedBottomBar.Screen
              name="title1"
              options={{headerShown:false}}
              position="LEFT"
              
            >
               {props => <Profile {...props} key="1"  />}
            </CurvedBottomBar.Screen>
            
            <CurvedBottomBar.Screen
              name="title3"
              options={{headerShown:false}}
              position="CENTER"
            >
               {props => <Map {...props} key="2" currentUser={currentUser} />}
            </CurvedBottomBar.Screen>

            <CurvedBottomBar.Screen
              name="title2"
              options={{headerShown:false}}
              
              position="RIGHT"
            >
               {props => <Settings key="3" />}
            </CurvedBottomBar.Screen>
            
          </CurvedBottomBar.Navigator>
        </NavigationContainer>
      </View>
    );
  };

  export default TabBar

  export const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    button: {
      marginVertical: 5,
    },
    bottomBar: {},
    btnCircle: {
      width: 60,
      height: 60,
      borderRadius: 35,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      padding: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 0.5,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 1,
      bottom: 30,
    },
    imgCircle: {
      width: 30,
      height: 30,
      tintColor: 'gray',
    },
    img: {
      width: 30,
      height: 30,
    },
  });