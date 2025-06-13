// reduxstore/__tests__/datamanager.test.ts
import churchReducer, { setChurchData, clearChurchData, ChurchState } from './datamanager';

describe('churchSlice reducer', () => {
  const initialState: ChurchState = {
    churchName: '',
    churchLocation: '',
    churchPhone: '',
    churchEmail: '',
    isHeadquarter: false,
    logoPreview: null,
    backgroundPreview: null,
  };

  it('should return the initial state', () => {
    expect(churchReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setChurchData', () => {
    const mockPreview = 'blob:test-preview-url';
    
    const action = setChurchData({
      churchName: 'Test Church',
      churchLocation: 'Test Location',
      logoPreview: mockPreview
    });
    
    const expectedState: ChurchState = {
      ...initialState,
      churchName: 'Test Church',
      churchLocation: 'Test Location',
      logoPreview: mockPreview
    };
    
    expect(churchReducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle clearChurchData', () => {
    const modifiedState: ChurchState = {
      churchName: 'Test Church',
      churchLocation: 'Test Location',
      churchPhone: '1234567890',
      churchEmail: 'test@example.com',
      isHeadquarter: true,
      logoPreview: 'blob:logo',
      backgroundPreview: 'blob:bg'
    };
    
    expect(churchReducer(modifiedState, clearChurchData())).toEqual(initialState);
  });

  it('should handle partial updates with setChurchData', () => {
    const firstUpdate = churchReducer(initialState, setChurchData({
      churchName: 'First Church',
      churchPhone: '1111111111'
    }));
    
    const secondUpdate = churchReducer(firstUpdate, setChurchData({
      churchLocation: 'Second Location',
      churchEmail: 'second@example.com'
    }));
    
    expect(secondUpdate).toEqual({
      ...initialState,
      churchName: 'First Church',
      churchPhone: '1111111111',
      churchLocation: 'Second Location',
      churchEmail: 'second@example.com'
    });
  });
});