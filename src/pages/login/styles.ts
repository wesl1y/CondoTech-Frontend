import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get('window');

export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4ff',
    },

    boxTop: {
        flex: 2,
        backgroundColor: '#4a90e2',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 100,

    },

    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fff', 
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },

    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 16,
        color: '#e6f2ff',
        textAlign: 'center',
    },

    boxMid: {
        flex: 2,
        alignItems: 'center',
        marginTop: -60,
    },

    loginCard: {
        width: '80%', 
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30, 
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },

    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },

    inputContainer: {
        marginBottom: 20,
    },

    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
        fontWeight: '500',
    },

    input: {
        height: 50,
        backgroundColor: '#f8f9fa',
        borderRadius: 12, 
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        height: 50,
    },

    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
    },

    eyeButton: {
        padding: 15,
    },

    loginButton: {
        backgroundColor: '#4a90e2',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10, 
        marginBottom: 20,
    },

    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    forgotPasswordText: {
        color: '#4a90e2',
        fontSize: 14,
        textAlign: 'center',
    },
    
});