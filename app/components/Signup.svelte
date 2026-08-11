<page actionBarHidden={true} class="page">
    <scrollView>
        <stackLayout class="container">
            <label text="Sign Up" class="title" />

            <!-- Role Selection -->
            <label text="Role" class="label" />
            <stackLayout orientation="horizontal" class="role-container">
                <button text="Student" class="role-btn" class:role-btn-active={role === 'student'} on:tap={() => role = 'student'} />
                <button text="Teacher" class="role-btn" class:role-btn-active={role === 'teacher'} on:tap={() => role = 'teacher'} />
            </stackLayout>

            <!-- Personal Info -->
            <label text="Personal Information" class="section-title" />
            <textField hint="First Name *" text={firstName} on:textChange={(e) => firstName = e.value} class="input" />
            <textField hint="Middle Name (Optional)" text={middleName} on:textChange={(e) => middleName = e.value} class="input" />
            <textField hint="Last Name *" text={lastName} on:textChange={(e) => lastName = e.value} class="input" />

            <!-- Student Type (only for students) -->
            {#if role === 'student'}
                <label text="Student Type" class="label" />
                <stackLayout orientation="horizontal" class="role-container">
                    <button text="Senior High" class="role-btn" class:role-btn-active={studentType === 'senior-high'} on:tap={() => studentType = 'senior-high'} />
                    <button text="College" class="role-btn" class:role-btn-active={studentType === 'college'} on:tap={() => studentType = 'college'} />
                </stackLayout>

                <!-- Senior High Fields -->
                {#if studentType === 'senior-high'}
                    <textField hint="Learner's Reference Number *" text={lrn} on:textChange={(e) => lrn = e.value} class="input" />
                    <textField hint="Strand *" text={strand} on:textChange={(e) => strand = e.value} class="input" />
                    <textField hint="Grade *" text={grade} on:textChange={(e) => grade = e.value} class="input" />
                {:else if studentType === 'college'}
                    <!-- College Fields -->
                    <textField hint="Student Number *" text={studentNumber} on:textChange={(e) => studentNumber = e.value} class="input" />
                    <textField hint="Course *" text={course} on:textChange={(e) => course = e.value} class="input" />
                    <textField hint="Year *" text={year} on:textChange={(e) => year = e.value} class="input" />
                {/if}
            {/if}

            <!-- Account Information -->
            <label text="Account Information" class="section-title" />
            <textField hint="Email *" text={email} on:textChange={(e) => email = e.value} class="input" keyboardType="email" />
            <textField hint="Username *" text={username} on:textChange={(e) => username = e.value} class="input" />

            <!-- Interests (Select 3) -->
            <label text="Select 3 Interests" class="label" />
            <stackLayout class="interests-grid">
                {#each interests as interest}
                    <button 
                        text={interest} 
                        class="interest-btn" 
                        class:interest-btn-selected={selectedInterests.includes(interest)}
                        on:tap={() => toggleInterest(interest)}
                        disabled={selectedInterests.length >= 3 && !selectedInterests.includes(interest)}
                    />
                {/each}
            </stackLayout>
            <label text={selectedInterests.length + '/3 selected'} class="selection-count" />

            <!-- Security -->
            <label text="Security" class="section-title" />
            <gridLayout columns="*, auto" class="password-container">
                <textField
                    hint="Password *"
                    text={password}
                    on:textChange={(e) => password = e.value}
                    secure={isSecure}
                    class="input password-input"
                    col={0}
                />
                <button
                    text={isSecure ? "Show" : "Hide"}
                    class="toggle-btn"
                    col={1}
                    on:tap={() => (isSecure = !isSecure)}
                />
            </gridLayout>
            <gridLayout columns="*, auto" class="password-container">
                <textField
                    hint="Confirm Password *"
                    text={confirmPassword}
                    on:textChange={(e) => confirmPassword = e.value}
                    secure={isConfirmSecure}
                    class="input password-input"
                    col={0}
                />
                <button
                    text={isConfirmSecure ? "Show" : "Hide"}
                    class="toggle-btn"
                    col={1}
                    on:tap={() => (isConfirmSecure = !isConfirmSecure)}
                />
            </gridLayout>

            <!-- Error Message -->
            {#if errorMessage}
                <label text={errorMessage} class="error-message" />
            {/if}

            <!-- Confirm Button -->
            <button text="Confirm" class="btn confirm" on:tap={handleSignup} />

            <!-- Back Button -->
            <button text="Back to Login" class="btn back" on:tap={goToLogin} />
        </stackLayout>
    </scrollView>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';
    import { register, createUserProfile } from '../services/firebase';
    import { SUBJECTS } from '../services/subjects';

    // Role
    let role = 'student';
    let studentType = 'senior-high';

    // Personal Info
    let firstName = '';
    let middleName = '';
    let lastName = '';

    // Student Specific
    let lrn = '';
    let strand = '';
    let grade = '';
    let studentNumber = '';
    let course = '';
    let year = '';

    // Account Info
    let email = '';
    let username = '';

    // Interests
    //
    // The same subjects the dashboard puts on books. They used to be their own
    // list, which offered Biology, Physics, Mathematics, Computer Science,
    // Technology, History and Culinary Arts, none of which a book can carry,
    // while Math, Computer and English were on books but could not be chosen.
    // An interest that cannot match a book is no use for recommending one.
    const interests = SUBJECTS;
    let selectedInterests: string[] = [];

    // Security
    let password = '';
    let confirmPassword = '';
    let isSecure = true;
    let isConfirmSecure = true;
    let errorMessage = '';

    function toggleInterest(interest: string) {
        if (selectedInterests.includes(interest)) {
            selectedInterests = selectedInterests.filter(i => i !== interest);
        } else if (selectedInterests.length < 3) {
            selectedInterests = [...selectedInterests, interest];
        }
    }

    function validateForm(): boolean {
        errorMessage = '';

        // Basic validation
        if (!firstName || !lastName) {
            errorMessage = 'Please fill in your name';
            return false;
        }

        if (role === 'student') {
            if (!studentType) {
                errorMessage = 'Please select student type';
                return false;
            }

            if (studentType === 'senior-high') {
                if (!lrn || !strand || !grade) {
                    errorMessage = 'Please fill in all senior high information';
                    return false;
                }
            } else if (studentType === 'college') {
                if (!studentNumber || !course || !year) {
                    errorMessage = 'Please fill in all college information';
                    return false;
                }
            }
        }

        if (!email || !username) {
            errorMessage = 'Please fill in account information';
            return false;
        }

        if (selectedInterests.length !== 3) {
            errorMessage = 'Please select exactly 3 interests';
            return false;
        }

        if (!password || !confirmPassword) {
            errorMessage = 'Please fill in password fields';
            return false;
        }

        if (password !== confirmPassword) {
            errorMessage = 'Passwords do not match';
            return false;
        }

        if (password.length < 6) {
            errorMessage = 'Password must be at least 6 characters';
            return false;
        }

        return true;
    }

    async function handleSignup() {
        if (!validateForm()) {
            return;
        }

        try {
            console.log('Attempting to create user account...');
            console.log('Email:', email);
            console.log('Username:', username);
            
            // Create user account
            const user = await register(email, password);
            console.log('User created successfully in Firebase Auth:', user);
            console.log('User UID:', user.uid);
            console.log('User email:', user.email);

            // Store additional user data in Firestore
            const userData = {
                email, // Explicitly include email
                role,
                firstName,
                middleName,
                lastName,
                studentType,
                lrn,
                strand,
                grade,
                studentNumber,
                course,
                year,
                username,
                interests: selectedInterests
            };

            console.log('Creating user profile in Firestore...');
            await createUserProfile(userData);
            console.log('User profile created successfully');

            // Navigate to login on success
            alert('Account created successfully! Please login.');
            goToLogin();
        } catch (error) {
            console.error('Signup failed:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            errorMessage = 'Signup failed: ' + error.message;
        }
    }

    function goToLogin() {
        navigate({
            page: Login
        } as any);
    }
</script>

<style>
    .page {
        background-color: white;
    }

    .container {
        padding: 20;
    }

    .title {
        font-size: 32;
        font-weight: bold;
        text-align: center;
        margin-bottom: 30;
        color: #033047;
    }

    .label {
        font-size: 16;
        font-weight: bold;
        color: #033047;
        margin-top: 20;
        margin-bottom: 10;
    }

    .section-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        margin-top: 30;
        margin-bottom: 15;
        border-bottom-width: 2;
        border-bottom-color: #033047;
    }

    .input {
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        font-size: 16;
        padding: 12;
        height: 50;
        margin: 5 0;
        background-color: white;
    }

    .role-container {
        margin: 10 0;
        width: 100%;
    }

    .role-btn {
        width: 48%;
        height: 45;
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
        border-radius: 8;
        font-size: 14;
        font-weight: bold;
        margin: 0 1%;
    }

    .role-btn-active {
        background-color: #033047;
        color: white;
    }

    .password-container {
        margin: 5 0;
        width: 100%;
        height: 50;
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        background-color: white;
        vertical-align: center;
        padding: 0;
    }

    .password-input {
        width: 100%;
        padding-left: 10;
        border-color: transparent;
        border-width: 0;
    }

    .toggle-btn {
        width: 60;
        height: 50;
        background-color: transparent;
        font-size: 14;
        color: #033047;
        border-width: 0;
    }

    .interests-grid {
        width: 100%;
        margin: 10 0;
        columns: 3;
    }

    .interest-btn {
        width: 100%;
        height: 40;
        margin: 2% 1%;
        background-color: white;
        color: #033047;
        border-width: 1;
        border-color: #033047;
        border-radius: 8;
        font-size: 12;
    }

    .interest-btn-selected {
        background-color: #033047;
        color: white;
    }

    .interest-btn:disabled {
        opacity: 0.5;
    }

    .selection-count {
        font-size: 14;
        color: #666;
        text-align: center;
        margin: 5 0;
    }

    .btn {
        width: 200;
        margin: 15 auto;
        padding: 15;
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .confirm {
        background-color: #033047;
        color: white;
        border-width: 0;
    }

    .back {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .error-message {
        font-size: 14;
        color: #c62828;
        text-align: center;
        margin: 10 0;
        padding: 10;
        background-color: #ffebee;
        border-radius: 8;
        border-width: 1;
        border-color: #ef9a9a;
    }
</style>