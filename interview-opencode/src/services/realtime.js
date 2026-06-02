import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import api from './api';

let stompClient = null;

export const initRealTime = () => {
  if (stompClient) return;

  const wsUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '/ws-chat') : 'http://localhost:8080/ws-chat';
  
  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      stompClient.subscribe('/topic/system.update', (message) => {
        window.dispatchEvent(new CustomEvent('system-update', { detail: message.body }));
      });
    },
  });

  stompClient.activate();
};

export const notifyUpdate = () => {
  if (stompClient && stompClient.connected) {
    try {
      stompClient.publish({ destination: '/topic/system.update', body: 'update' });
    } catch (e) {
      console.error('Failed to publish update', e);
    }
  }
};
