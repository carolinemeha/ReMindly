import { create } from 'zustand';
import { Event, Category, Reminder, CreateEventInput } from '@/types';
import { eventsService } from '@/services/events.service';
import { realtimeService } from '@/services/realtime.service';

interface EventsState {
  events: Event[];
  categories: Category[];
  selectedEvent: Event | null;
  loading: boolean;
  error: string | null;
  fetchEvents: (filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    status?: string;
  }) => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<CreateEventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  markEventAsDone: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, icon?: string, color?: string) => Promise<void>;
  createReminder: (eventId: string, remindBefore: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  setSelectedEvent: (event: Event | null) => void;
  subscribeToRealtime: (userId: string) => void;
  unsubscribeFromRealtime: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  categories: [],
  selectedEvent: null,
  loading: false,
  error: null,

  fetchEvents: async (filters) => {
    set({ loading: true, error: null });
    try {
      const events = await eventsService.getEvents(filters);
      set({ events, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEventById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const event = await eventsService.getEventById(id);
      set({ selectedEvent: event, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createEvent: async (input: CreateEventInput) => {
    set({ loading: true, error: null });
    try {
      const event = await eventsService.createEvent(input);
      set((state) => ({
        events: [...state.events, event],
        loading: false,
      }));
      return event;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateEvent: async (id: string, updates: Partial<CreateEventInput>) => {
    set({ loading: true, error: null });
    try {
      const updatedEvent = await eventsService.updateEvent(id, updates);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await eventsService.deleteEvent(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  markEventAsDone: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedEvent = await eventsService.markEventAsDone(id);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await eventsService.getCategories();
      set({ categories, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createCategory: async (name: string, icon?: string, color?: string) => {
    set({ loading: true, error: null });
    try {
      const category = await eventsService.createCategory(name, icon, color);
      set((state) => ({
        categories: [...state.categories, category],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createReminder: async (eventId: string, remindBefore: string) => {
    set({ loading: true, error: null });
    try {
      await eventsService.createReminder(eventId, remindBefore);
      // Rafraîchir l'événement pour obtenir les nouveaux rappels
      await get().fetchEventById(eventId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteReminder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await eventsService.deleteReminder(id);
      if (get().selectedEvent) {
        await get().fetchEventById(get().selectedEvent!.id);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setSelectedEvent: (event: Event | null) => {
    set({ selectedEvent: event });
  },

  subscribeToRealtime: (userId: string) => {
    // Écouter les insertions
    realtimeService.subscribeToEvents(
      userId,
      (newEvent) => {
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },
      (updatedEvent) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === updatedEvent.id ? updatedEvent : e
          ),
          selectedEvent:
            state.selectedEvent?.id === updatedEvent.id
              ? updatedEvent
              : state.selectedEvent,
        }));
      },
      (deletedId) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== deletedId),
          selectedEvent:
            state.selectedEvent?.id === deletedId
              ? null
              : state.selectedEvent,
        }));
      }
    );
  },

  unsubscribeFromRealtime: () => {
    realtimeService.unsubscribeAll();
  },
}));

