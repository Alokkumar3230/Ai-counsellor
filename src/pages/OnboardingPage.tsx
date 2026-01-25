import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { completeOnboarding } from '@/db/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OnboardingData } from '@/types';

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Academic Background', description: 'Your education and achievements' },
  { id: 3, title: 'Goals & Preferences', description: 'What are you looking for?' },
  { id: 4, title: 'Budget & Exams', description: 'Financial planning and test preparation' },
];

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands', 'Singapore', 'Hong Kong', 'Switzerland'];
const FIELDS = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Sciences', 'Social Sciences'];
const EXAMS = ['SAT', 'ACT', 'GRE', 'GMAT', 'TOEFL', 'IELTS', 'Duolingo'];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    current_education_level: '',
    field_of_study: '',
    gpa: 0,
    test_scores: {},
    target_degree: '',
    preferred_countries: [],
    preferred_fields: [],
    budget_min: 0,
    budget_max: 0,
    exams_taken: [],
    exams_planned: [],
  });

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(item)) {
      updateField(
        field,
        currentArray.filter((i) => i !== item)
      );
    } else {
      updateField(field, [...currentArray, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await completeOnboarding(user.id, formData);
      await refreshProfile();
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help us understand your background and goals to provide personalized recommendations
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-sm ${
                  step.id === currentStep
                    ? 'text-primary font-semibold'
                    : step.id < currentStep
                      ? 'text-success'
                      : 'text-muted-foreground'
                }`}
              >
                Step {step.id}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="education_level">Current Education Level *</Label>
                  <Select
                    value={formData.current_education_level}
                    onValueChange={(value) => updateField('current_education_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_of_study">Field of Study *</Label>
                  <Input
                    id="field_of_study"
                    value={formData.field_of_study}
                    onChange={(e) => updateField('field_of_study', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (out of 4.0) *</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={formData.gpa || ''}
                    onChange={(e) => updateField('gpa', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target_degree">Target Degree *</Label>
                  <Select
                    value={formData.target_degree}
                    onValueChange={(value) => updateField('target_degree', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor's</SelectItem>
                      <SelectItem value="masters">Master's</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Countries *</Label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((country) => (
                      <Button
                        key={country}
                        type="button"
                        variant={formData.preferred_countries.includes(country) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem('preferred_countries', country)}
                      >
                        {country}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Fields of Study *</Label>
                  <div className="flex flex-wrap gap-2">
                    {FIELDS.map((field) => (
                      <Button
                        key={field}
                        type="button"
                        variant={formData.preferred_fields.includes(field) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem('preferred_fields', field)}
                      >
                        {field}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Annual Budget (USD) *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_min" className="text-xs text-muted-foreground">
                        Minimum
                      </Label>
                      <Input
                        id="budget_min"
                        type="number"
                        value={formData.budget_min || ''}
                        onChange={(e) => updateField('budget_min', parseInt(e.target.value) || 0)}
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget_max" className="text-xs text-muted-foreground">
                        Maximum
                      </Label>
                      <Input
                        id="budget_max"
                        type="number"
                        value={formData.budget_max || ''}
                        onChange={(e) => updateField('budget_max', parseInt(e.target.value) || 0)}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Exams Already Taken</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMS.map((exam) => (
                      <Button
                        key={exam}
                        type="button"
                        variant={formData.exams_taken.includes(exam) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem('exams_taken', exam)}
                      >
                        {exam}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Exams Planned</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMS.map((exam) => (
                      <Button
                        key={exam}
                        type="button"
                        variant={formData.exams_planned.includes(exam) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayItem('exams_planned', exam)}
                      >
                        {exam}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Completing...' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
