int main(void)
{
  float celsius, fahr;
  int lower, upper, step;
  lower = 0;
  upper = 300;
  step = 20;
  celsius = lower;
  while (celsius <= upper)
  {
    fahr = (9.0 / 5.0) * celsius + 32.0f;
    printf("%3.0f\t\t%6.1f\n", celsius, fahr);
    celsius = celsius + step;
  }

  return 0;
}
--------------------------------------
float celsius_to_fahrenheit(int celsius);

int main(void)
{
  float celsius, fahr;
  int lower, upper, step;

  lower = 0;
  upper = 300;
  step = 30;

  celsius = lower;
  while (celsius <= upper)
  {
    fahr = celsius_to_fahrenheit(celsius);
    printf("%3.0f\t\t%6.1f\n", celsius, fahr);
    celsius += step;
  }

  return 0;
}
--------------------------------------------------------
int main() {
  int n, reverse = 0, remainder, original;

  printf("Enter an integer: ");
  scanf("%d", &n);

  original = n;  

  while (n != 0) {
    remainder = n % 10;
    reverse = reverse * 10 + remainder;
    n /= 10;
  }
  ---------------------------------------------