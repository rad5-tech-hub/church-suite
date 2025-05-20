import churchSlice, { setChurchData, clearChurchData, ChurchState } from './datamanager';

describe('churchSlice Reducer', () => {
  const initialState: ChurchState = {
    churchName: '',
    churchEmail: '',
    churchPhone: '',
    churchLocation: '',
    isHeadquarter: '',
    logoPreview: null, // Default value
    backgroundPreview: null, // Default value
    logoFile: null,
    backgroundFile: null,
  };

  describe('Initial State', () => {
    it('should return the initial state when an unknown action is dispatched', () => {
      const state = churchSlice(undefined, { type: 'UNKNOWN_ACTION' });
      expect(state).toEqual(initialState);
    });
  });

  describe('setChurchData Action', () => {
    it('should update the state with the provided church data', () => {
      const payload: ChurchState = {
        churchName: 'Grace Church',
        churchEmail: 'grace@example.com',
        churchPhone: '123-456-7890',
        churchLocation: '123 Church Street',
        isHeadquarter: 'yes',
      };

      const nextState = churchSlice(initialState, setChurchData(payload));
      expect(nextState).toEqual(payload);
    });

    it('should overwrite only the provided fields and keep others unchanged', () => {
      const partialPayload = {
        churchName: 'New Grace Church',
      };

      const currentState: ChurchState = {
        churchName: 'Grace Church',
        churchEmail: 'grace@example.com',
        churchPhone: '123-456-7890',
        churchLocation: '123 Church Street',
        isHeadquarter: 'yes',
      };

      const nextState = churchSlice(currentState, setChurchData(partialPayload as ChurchState));
      expect(nextState).toEqual({
        ...currentState,
        churchName: 'New Grace Church',
      });
    });
  });

  describe('clearChurchData Action', () => {
    it('should reset the state to the initial state', () => {
      const currentState: ChurchState = {
        churchName: 'Grace Church',
        churchEmail: 'grace@example.com',
        churchPhone: '123-456-7890',
        churchLocation: '123 Church Street',
        isHeadquarter: 'yes',
      };

      const nextState = churchSlice(currentState, clearChurchData());
      expect(nextState).toEqual(initialState);
    });
  });
});