import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useState, useEffect } from 'react';
import { firebase } from './config'


import Login from "./src/Login";
import Registration from "./src/Registration";
import Header from "./components/Header";
import Dashboard from "./src/Dashboard";

const Stack = createStackNavigator();


function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }
  useEffect(() => {
    const subscriber = firebase.auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; 
  }, []);

  if (initializing) return null;

  if (!user) {
    return (
      <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{headerShown:false}}
      />
      <Stack.Screen
        name="Registration"
        component={Registration}
        options={{headerShown:false}}
      />
    </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{headerShown:false}}
      />
      <Stack.Screen
        name="Map"
        component={Map}
        options={{headerShown:false}}
      />
    </Stack.Navigator>
  );
}

export default () => {
  return (
    <NavigationContainer>
      <App />
    </NavigationContainer>
  )
}